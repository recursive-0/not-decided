import { NudeTags, ParsedTag, Tags } from "@/types/editor";
import { ActionMessageType } from "@/types/stream";
import { parseClosingTag, parseTag } from "./doc-helpers";

enum ParserState {
  normal = "normal",
  in_tag = "in_tag",
}

enum ParserMode {
  normal = "normal",
  thinking = "thinking",
  action = "action",
  content = "content"
}

interface ParserCallbacks {
  onOpenTag: (tag: ParsedTag) => void;
  onCloseTag: (tag: ParsedTag) => void;
  onTextContent: (txt: string) => void;
  onCodeBlock: (code: CodeBlockNodeType) => void;
  onMarkdownChunk: (chunk: string) => void;
  onAction: (action: ActionMessageType) => void;
}


export type CodeBlockNodeType = {
  lang: string;
  content: string;
};

export class StreamParser {
  private isStreamActive: boolean = false;
  private state: ParserState = ParserState.normal;
  private buffer: string = "";
  private thoughtBuffer: string = "";
  private contentBuffer: string = "";
  private actionBuffer: string = "";
  private textBuffer: string = "";
  private tagBuffer: string = "";
  private tagStack: string[] = [];
  private codeBlockNode: CodeBlockNodeType = {
    lang: "",
    content: "",
  };
  private mode: ParserMode = ParserMode.normal

  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.state = ParserState.normal;
    this.isStreamActive = true;
    this.actionBuffer = "";
    this.contentBuffer = "";
    this.thoughtBuffer = "";
    this.textBuffer = "";
    this.tagStack = [];
    this.codeBlockNode = {
      lang: "",
      content: "",
    };
    this.mode = ParserMode.normal
  }

  public setMode(mode: ParserMode) {
    this.mode = mode;
  }

  private flushTextBuffer() {
    if (this.textBuffer.length === 0) return;

    if (this.tagStack.length === 0) {
      console.warn("Flushing text buffer when tag stack is empty!!!");
      console.log("Text content is: ", this.textBuffer);
      this.clearTextBuffer();
      return;
    }


    const topTagInStack = this.tagStack[this.tagStack.length - 1];

    if(this.mode === ParserMode.normal) {
      // Dead content so rendering it in chat
      this.callbacks.onMarkdownChunk(this.textBuffer);
      this.clearTextBuffer();
      return;
    }

    if (topTagInStack === Tags.code) {
      this.codeBlockNode.content += this.textBuffer;
      this.clearTextBuffer();
      return;
    }

    if(this.mode === ParserMode.thinking && this.state === ParserState.normal) {
      this.thoughtBuffer += this.textBuffer;
      this.callbacks.onMarkdownChunk(this.textBuffer);
      this.clearTextBuffer();
      return;
    }

    if(this.mode === ParserMode.action && this.state === ParserState.normal) {
      this.actionBuffer += this.textBuffer;
      console.log("Action buffer is: ", this.actionBuffer);
      try {
        const action = JSON.parse(this.actionBuffer) as ActionMessageType;
        console.log("Action is: ", action);
        this.callbacks.onAction(action);
        this.actionBuffer = "";
      } catch (error) {
        console.error("Still need to buffer the action: ", error);
      }
      this.clearTextBuffer();
      return;
    }

    // for content buffer we don't need newlines or special characters

    const textToEmit = this.textBuffer.replace(/[\n\r\t]/g, "");

    if (textToEmit.length === 0) {
      this.clearTextBuffer();
      return;
    }

    if(this.mode === ParserMode.content && this.state === ParserState.normal) {
      this.contentBuffer += this.textBuffer;
      this.callbacks.onTextContent(textToEmit);
      this.clearTextBuffer();
      return;
    }

  }


  processChunk(chunk: string) {

    console.log("CHUNK to process is: ", chunk);

    if(!this.isStreamActive) {
      console.log("Stream is not active, skipping chunk");
      return;
    }

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.buffer += char;
      this.processCharacter(char);
    }

    console.log("TAG STACK IS: ", this.tagStack);

    this.flushTextBuffer();
  }

  // private openTag() {
  //   const tagName = this.openingTag
  //   // const originalTagText = `[${this.openingTag}]`;
  //   console.log(`Parser: Attempting to open tag: "${tagName}"`);

  //   if (tagName.includes("code lang")) {
  //     console.log("FOUND CODE opening tag");
  //     const codeBlockAttributes = extractCodeBlockAttributes(tagName);
  //     this.resetCodeBlockNode();
  //     this.codeBlockNode.lang = codeBlockAttributes.lang || "text";
  //     this.tagStack.push(Tags.code);
  //     this.clearStateAfterTag();
  //     return;
  //   }

  //   if (!isValidTag(tagName)) {
  //     console.error("Invalid tag: ", tagName);
  //     this.flushTextBuffer();
  //     this.state = ParserState.normal;
  //     this.openingTag = "";
  //     return;
  //   }

  //   if(tagName === Tags.thinking) {
  //     this.mode = Tags.thinking;
  //     this.setMode(this.mode);
  //   } else if(tagName === Tags.action) {
  //     this.mode = Tags.action;
  //     this.setMode(this.mode);
  //     this.actionBuffer = "";
  //   } else if(tagName === Tags.content) {
  //     this.mode = Tags.content;
  //     this.setMode(this.mode);
  //   } else {
  //     console.log("Found content tag i guess: ", tagName);
  //     this.callbacks.onOpenTag(tagName as Tags);
  //   }

  //   this.tagStack.push(tagName)
  //   this.clearTextBuffer();
  //   this.openingTag = "";
  //   this.state = ParserState.normal;
  // }

  // private closeTag() {
  //   console.log("Current tag stack in closetag is: ", this.tagStack);
  //   const closingTag = this.openingTag



  //   if (!isValidTag(closingTag)) {
  //     this.flushTextBuffer();
  //     this.state = ParserState.normal;
  //     this.openingTag = "";
  //     return;
  //   }

  //   if (closingTag === Tags.code) {
  //     this.callbacks.onCodeBlock(this.codeBlockNode);
  //     this.resetCodeBlockNode();
  //     this.clearStateAfterTag();
  //     return;
  //   }

  //   if(closingTag === "</TKH>" || closingTag === "</ACT>" || closingTag === "</CNT>") {
  //     this.mode = Tags.normal;
  //     this.setMode(this.mode);
  //   } else {
  //     console.log("Found content tag i guess: ", closingTag);
  //     this.callbacks.onCloseTag(closingTag as Tags);
  //   }


  //     this.tagStack.pop();
  //     this.clearStateAfterTag();
  //     return;

  // }

  clearStateAfterTag() {
    this.clearTextBuffer();
    this.state = ParserState.normal;
  }

  clearTagBuffer(){
    this.tagBuffer = ""
  }


  processClosingTag(tagString: string){

    const nudeTag = parseClosingTag(tagString)

    if(!nudeTag){
      console.warn("Invalid closing tag: ", tagString)
      throw new Error("invalid closing tag")
    }

    if(nudeTag.tag === NudeTags.thinking || nudeTag.tag === NudeTags.action || nudeTag.tag === NudeTags.cnt ){
      this.mode = ParserMode.normal
    } else {
      this.callbacks.onCloseTag(nudeTag)
    }
  }


  processOpeningTag(tagString: string){
    const parsed = parseTag(tagString)

    console.log("parsed opening tag is: ", parsed)

    if(!parsed){
      console.warn("Invalid opening tag: ", parsed)
      return
    }

    if(parsed?.tag === NudeTags.thinking){
      this.mode = ParserMode.thinking
      this.tagStack.push(parsed.tag)
    } else if(parsed?.tag === NudeTags.action){
      this.mode = ParserMode.action
      this.tagStack.push(parsed.tag)
    } else if(parsed?.tag === NudeTags.cnt){
      this.mode = ParserMode.content
      this.tagStack.push(parsed.tag)
    } else {
      console.warn("We must be in content mode because tag is not TKH | ACT | CNT: ", parsed?.tag)
      if(this.mode === ParserMode.content){
        this.tagStack.push(parsed.tag)
        this.callbacks.onOpenTag(parsed)
      } else {
        console.warn("Invalid opening tag so defaulting to paragraph: ", parsed)
        const paraNode = {
          tag: NudeTags.p,
          attributes: {}
        }
        this.callbacks.onOpenTag(paraNode)
      }
    }
  }


  processCompleteTag(tagString: string) {

    if(tagString.startsWith("</")){
      this.processClosingTag(tagString)
      return
    }

    this.processOpeningTag(tagString)
  }

  processCharacter(char: string) {
    switch (this.state) {
      case ParserState.normal:
        if (char === "<") {
          this.flushTextBuffer();
          this.clearTagBuffer()
          this.state = ParserState.in_tag;
          this.tagBuffer = "<"
        } else {
          this.textBuffer += char;
        }
        break;
      case ParserState.in_tag:
        this.tagBuffer += char;
        if(char === ">") {
          this.processCompleteTag(this.tagBuffer);
          this.clearTagBuffer();
          this.state = ParserState.normal;
        }
        break;
      default:
        console.log("OH MY GOD, we found a state that doesn't exist!!!");
        break;
    }
  }

  public stopStreaming() {
    this.reset();
  }

  private clearTextBuffer() {
    this.textBuffer = "";
  }

  private reset() {
    this.state = ParserState.normal;
    this.clearTextBuffer();
    this.tagStack = [];
  }

}


