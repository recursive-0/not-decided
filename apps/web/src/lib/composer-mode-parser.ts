import { Tags } from "@/types/editor";

enum ParserState {
  normal = "normal",
  thought = "thought",
  inside_thought_tag = "inside_thought_tag",
  collect_thought_text = "collect_thought_text",
  tag_start = "tag_start",
  tag_name = "tag_name",
  tag_end = "tag_end",
  closing_tag_start = "closing_tag_start",
  closing_tag_name = "closing_tag_name",
  editor_content = "editor_content",
  inside_editor_content_tag = "inside_editor_content_tag",
}

interface ParserCallbacks {
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
  onCodeBlock: (code: CodeBlockNodeType) => void;
}

const all_tags = [
  "<h1>",
  "<h2>",
  "<h3>",
  "<b>",
  "<em>",
  "<strong>",
  "<p>",
  "<code>",
  "<icode>",
  "<ul>",
  "<li>",
  "<quote>",
  "<ol>",
  "<checkbox>",
];

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "p",
  "b",
  "em",
  "strong",
  "ul",
  "ol",
  "li",
  "code",
  "icode",
  "quote",
  "checkbox",
];

const isValidTag = (tag: string) => {
  return ALLOWED_TAGS.find((t) => t === tag) ? true : false;
};

const includesAllowedTags = (tag: string) => {
  return all_tags.find((t) => t.includes(tag)) ? true : false;
};

export type CodeBlockNodeType = {
  lang: string;
  content: string;
};

export class ComposerModeParser {
  private state: ParserState = ParserState.normal;
  private textBuffer: string = "";
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private codeBlockNode: CodeBlockNodeType = {
    lang: "",
    content: "",
  };

  constructor(private callbacks: ParserCallbacks) {}

  private flushTextBuffer() {
    if (this.textBuffer.length === 0) return;

    if (this.tagStack.length === 0) {
      console.warn("Flushing text buffer when tag stack is empty!!!");
      console.log("Text content is: ", this.textBuffer);
      this.clearTextBuffer();
      return;
    }

    let textToEmit: string;
    const topTagInStack = this.tagStack[this.tagStack.length - 1];

    if (topTagInStack === Tags.code) {
      textToEmit = this.textBuffer;
      this.clearTextBuffer();
      return;
    }

    textToEmit = this.textBuffer.replace(/[\n\r\t]/g, "");
    if (textToEmit.length === 0) {
      this.clearTextBuffer();
      return;
    }

    console.log("Flushing text buffer: ", this.textBuffer)
    this.callbacks.onTextContent(this.textBuffer);
    this.clearTextBuffer()
  }

  private clearTextBuffer() {
    this.textBuffer = "";
  }

  private reset() {
    this.state = ParserState.normal;
    this.clearTextBuffer();
    this.currentTagName = "";
    this.tagStack = [];
  }

  private resetCodeBlockNode() {
    this.codeBlockNode = {
      lang: "",
      content: "",
    };
  }

  processChunk(chunk: string) {
    // if (!this.isActive) {
    //   console.warn("Error: trying to parse chunk when stream is not active");
    //   throw new Error("Can't processs a dead stream");
    // }

    console.log("CHUNK to process is: ", chunk);

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.processEachCharacter(char);
    }

    console.log("TAG STACK IS: ", this.tagStack);

    this.flushTextBuffer();
  }

  private openTag() {
    const tagName = this.currentTagName.toLowerCase();
    // const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    if (tagName.includes("code lang")) {
      const topTag = this.tagStack[this.tagStack.length - 1];
      console.log("FOUND CODE opening tag");
      console.log("TOP TAG IS: ", topTag);
      const codeBlockAttributes = extractCodeBlockAttributes(tagName);
      this.resetCodeBlockNode();
      this.codeBlockNode.lang = codeBlockAttributes.lang || "text";
      this.tagStack.push(Tags.code);

      this.clearStateAfterTag();
      return;
    }

    if (!isValidTag(tagName)) {
      console.error("Invalid tag: ", tagName);
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    this.tagStack.push(tagName)
    this.callbacks.onOpenTag(tagName as Tags);
    this.clearTextBuffer();
    this.currentTagName = "";
    this.state = ParserState.normal;
  }

  private closeTag() {
    console.log("Current tag stack in closetag is: ", this.tagStack);
    const closingTag = this.currentTagName.toLowerCase();
    // const originalTagText = `[/${this.currentTagName}]`;
    const topTagInStack = this.tagStack[this.tagStack.length - 1];

    if (!isValidTag(closingTag)) {
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (closingTag === Tags.code) {
      this.callbacks.onCodeBlock(this.codeBlockNode);
      this.resetCodeBlockNode();
      this.clearStateAfterTag();
      return;
    }

    if (closingTag === topTagInStack) {
      this.callbacks.onCloseTag(closingTag as Tags);
      this.tagStack.pop();
      this.clearStateAfterTag();
      return;
    }

    console.warn("This is an invalid state inside closeTag");
  }

  clearStateAfterTag() {
    this.clearTextBuffer();
    this.currentTagName = "";
    this.state = ParserState.normal;
  }

  processEachCharacter(char: string) {
    switch (this.state) {
      case ParserState.normal:
        if (char === "<") {
          this.flushTextBuffer();
          this.textBuffer += char;
          this.state = ParserState.tag_start;
        } else {
          this.textBuffer += char;
        }
        break;
      case ParserState.tag_start:
        if (char === "/") {
          console.log("Found /, switching to CLOSING_TAG_START");
          this.textBuffer += char;
          this.state = ParserState.closing_tag_start;
        } else if (includesAllowedTags(this.textBuffer + char)) {
          this.textBuffer += char;
          this.currentTagName = char;
          this.state = ParserState.tag_name;
        } else {
          this.textBuffer += char;
          this.state = ParserState.normal;
        }
        break;
      case ParserState.tag_name:
        if (char === ">") {
          this.textBuffer += char;
          this.openTag();
        } else {
          this.textBuffer += char;
          this.currentTagName += char;
        }
        break;
      case ParserState.closing_tag_start:
        if (char === ">") {
          console.log("CLOSING TAG IS: ", this.currentTagName);
          this.textBuffer += char;
          this.closeTag();
        } else {
          this.textBuffer += char;
          this.currentTagName += char;
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
}

function extractCodeBlockAttributes(tagName: string) {
  const langMatch = tagName.match(/lang=["']([^"']+)["']/);

  return {
    tag: "code",
    lang: langMatch ? langMatch[1] : "text",
    fullMatch: tagName,
  };
}
