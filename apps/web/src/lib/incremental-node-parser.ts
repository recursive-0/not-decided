import type { Tags } from "./incremental-prosemirror-renderer";

enum ParserState {
  NORMAL = "normal",
  TAG_START = "tag_start",
  TAG_NAME = "tag_name",
  TAG_END = "tag_end",
  CLOSING_TAG_START = "closing_tag_start",
  CLOSING_TAG_NAME = "closing_tag_name",
  TEXT = "text",
}

enum StreamingState {
  CHAT = "CHAT",
  COMPOSER = "COMPOSER"
}

interface ParserCallbacks {
  sendTokensCallback: (tokens: string) => void,
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
}

const ALLOWED_TAGS = ["H1", "H2", "H3", "B", "I", "P", "CODE", "UL", "LI", "QUOTE", "OL", "CHECKBOX", "ICODE"]

const TAGS = ["[H1]", "[H2]", "[H3]", "[B]", "[I]", "[P]", "[CODE]", "[UL]", "[LI]", "[QUOTE]", "[OL]", "[CHECKBOX]", "[ICODE]", "<CHAT>", "<COMPOSER>"]

const includesAllowedTags = (ch: string) => {

  return TAGS.find((tag) => tag.includes(ch)) ? true : false

}

export class IncrementalParser {
  private state: ParserState = ParserState.NORMAL;
  private streamingState: StreamingState = StreamingState.CHAT
  private textBuffer: string = "";
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private isStreaming: boolean = false;


  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.isStreaming = true;
    this.reset();
  }

  public stopStreaming() {
    this.isStreaming = false;
    this.finalize();
  }

  public reset() {
    this.state = ParserState.NORMAL;
    this.textBuffer = "";
    this.currentTagName = "";
    this.tagStack = [];
  }

  public finalize() {
    if (this.textBuffer.length > 0) {
      this.flushTextBuffer();
    }

    // Auto-close any open tags
    if (this.tagStack.length > 0) {
      console.warn("Unclosed tags at stream end:", this.tagStack);
      while (this.tagStack.length > 0) {
        const tag = this.tagStack.pop()!;
        this.callbacks.onCloseTag(tag as Tags);
      }
    }

    this.reset();
  }

  process(chunk: string) {
    if (!this.isStreaming) {
      console.warn("Received chunk while not streaming");
      return;
    }

    // console.log("=== Processing Chunk ===");
    // console.log("Chunk:", JSON.stringify(chunk)); // Use JSON.stringify to see control chars

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];

      switch (this.state) {
        case ParserState.NORMAL:
          if(this.streamingState === StreamingState.CHAT){
            this.callbacks.onChatModeTokens(char)
          } else if(this.streamingState === StreamingState.COMPOSER){
            this.callbacks.onComposerModeTokens(char)
          } else if(char === "<"){
             this.flushTextBuffer()
             this.textBuffer += char
             this.state = ParserState.TAG_START 
          } else if (char === "[") {
            console.log("Found [, switching to TAG_START", this.textBuffer);
            this.flushTextBuffer();
            this.textBuffer += char;
            this.state = ParserState.TAG_START;
          } else {
            this.textBuffer += char;
          }
          break;

        case ParserState.TAG_START:
          if (char === "/") {
            console.log("Found /, switching to CLOSING_TAG_START");
            this.textBuffer += char;
            this.state = ParserState.CLOSING_TAG_START;
          } else if (includesAllowedTags(this.textBuffer + char)){
            this.textBuffer += char;
            this.currentTagName = char;
            this.state = ParserState.TAG_NAME;
          } else {
            this.textBuffer += char;
            this.state = ParserState.NORMAL;
          }
          break;

        case ParserState.TAG_NAME:
          if(char === ">"){
            this.textBuffer += char
            this.openAngleTag()
          } else if (char === "]") {
            this.textBuffer += char;
            this.openTag();
          } else {
            this.textBuffer += char;
            this.currentTagName += char;
          }
          break;

        case ParserState.CLOSING_TAG_START:
          if (char === "]") {
            console.log("CLOSING TAG IS: ", this.currentTagName)
            this.textBuffer += char;
            this.closeTag();
          } else {
            this.textBuffer += char;
            this.currentTagName += char;
          }
          break;
      }
    }

    // Only flush text buffer at end of chunk if we're in NORMAL state
    // This is the key fix - don't flush when in the middle of parsing a tag
    if (this.textBuffer.length > 0 && this.state === ParserState.NORMAL) {
      this.flushTextBuffer();
    }

    console.log("=== End of Chunk ===");
  }

  private isAlpha(char: string): boolean {
    return /^[A-Za-z]$/.test(char);
  }



  private flushTextBuffer() {
    if (this.textBuffer.length > 0) {
      console.log(`Emitting text: "${this.textBuffer}"`);
      this.callbacks.onTextContent(this.textBuffer);
      this.textBuffer = "";
    }
  }

  private clearTextBuffer() {
    this.textBuffer = "";
  }

  private clearCurrentTagName() {
    this.currentTagName = "";
  }

  private openAngleTag(){
    const currentTag = this.textBuffer

    if(includesAllowedTags(currentTag)){
       if(currentTag === '<CHAT>'){
          this.streamingState = StreamingState.CHAT
       } else if(currentTag === "<COMPOSER>"){
        this.streamingState = StreamingState.COMPOSER
       } else {
          throw new Error("Formed angle tag is niether chat nor composer")
       }
       this.clearTextBuffer()
    } else {
      this.flushTextBuffer()
      this.state = ParserState.NORMAL
    }
  }

  private openTag() {
    const tagName = this.currentTagName;

    console.log("TAG IS: ", tagName)

    if (ALLOWED_TAGS.includes(tagName)) {
      console.log(`Opening tag: ${tagName}`);
      this.tagStack.push(tagName);
      this.callbacks.onOpenTag(tagName as Tags);
    } else {
      this.flushTextBuffer();
    }

    this.clearCurrentTagName();
    this.clearTextBuffer();
    this.state = ParserState.NORMAL;
  }

  private closeTag() {
    const closingTag = this.currentTagName;
    const lastOpenedTag = this.tagStack.pop() || "";

    if (closingTag !== lastOpenedTag) {
      console.warn(
        `Tag mismatch: expected ${lastOpenedTag}, got ${closingTag}`
      );
      // Handle mismatch - could push the tag back if needed
      this.tagStack.push(lastOpenedTag);
      this.flushTextBuffer();
    }

    console.log(`Closing tag: ${closingTag}`);
    this.clearCurrentTagName();
    this.clearTextBuffer();
    this.state = ParserState.NORMAL;
    this.callbacks.onCloseTag(closingTag as Tags);
  }

}