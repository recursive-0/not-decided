import { MODE, Tags } from "@/types/editor";
import { ActionMessageType } from "@/types/stream";

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
  onMarkdownChunk: (chunk: string) => void;
  onAction: (action: ActionMessageType) => void;
}

const all_tags = [
  "<h1>",
  "</h1>",
  "<h2>",
  "</h2>",
  "<h3>",
  "</h3>",
  "<b>",
  "</b>",
  "<em>",
  "</em>",
  "<strong>",
  "</strong>",
  "<p>",
  "</p>",
  "<code>",
  "</code>",
  "<icode>",
  "</icode>",
  "<ul>",
  "</ul>",
  "<li>",
  "</li>",
  "<quote>",
  "</quote>",
  "<ol>",
  "</ol>",
  "<checkbox>",
  "</checkbox>",
  "<TKH>",
  "</TKH>",
  "<ACT>",
  "</ACT>",
  "<CNT>",
  "</CNT>",
];


const isValidTag = (tag: string) => {
  return all_tags.find((t) => t === tag) ? true : false;
};

const includesAllowedTags = (tag: string) => {
  return all_tags.find((t) => t.includes(tag)) ? true : false;
};

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
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private codeBlockNode: CodeBlockNodeType = {
    lang: "",
    content: "",
  };
  private mode: MODE = Tags.normal;

  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.state = ParserState.normal;
    this.isStreamActive = true;
    this.actionBuffer = "";
    this.contentBuffer = "";
    this.thoughtBuffer = "";
    this.textBuffer = "";
    this.currentTagName = "";
    this.tagStack = [];
    this.codeBlockNode = {
      lang: "",
      content: "",
    };
    this.mode = Tags.normal;
  }

  public setMode(mode: MODE) {
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

    if(this.mode === Tags.normal) {
      this.callbacks.onTextContent(this.textBuffer);
      this.clearTextBuffer();
      return;
    }

    if (topTagInStack === Tags.code) {
      this.codeBlockNode.content += this.textBuffer;
      this.clearTextBuffer();
      return;
    }

    if(this.mode === Tags.thinking && this.state === ParserState.normal) {
      this.thoughtBuffer += this.textBuffer;
      this.callbacks.onMarkdownChunk(this.textBuffer);
      this.clearTextBuffer();
      return;
    }

    if(this.mode === Tags.action && this.state === ParserState.normal) {
      this.actionBuffer += this.textBuffer;
      console.log("Action buffer is: ", this.actionBuffer);
      try {
        const action = JSON.parse(this.actionBuffer) as ActionMessageType;
        console.log("Action is: ", action);
        this.callbacks.onAction(action);
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

    if(this.mode === Tags.content && this.state === ParserState.normal) {
      this.contentBuffer += this.textBuffer;
      this.callbacks.onTextContent(textToEmit);
      this.clearTextBuffer();
      return;
    }

  }


  processChunk(chunk: string) {
    // if (!this.isActive) {
    //   console.warn("Error: trying to parse chunk when stream is not active");
    //   throw new Error("Can't processs a dead stream");
    // }

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

  private openTag() {
    const tagName = this.textBuffer;
    // const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    if (tagName.includes("code lang")) {
      console.log("FOUND CODE opening tag");
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

    if(tagName === Tags.thinking) {
      this.mode = Tags.thinking;
      this.setMode(this.mode);
    } else if(tagName === Tags.action) {
      this.mode = Tags.action;
      this.setMode(this.mode);
      this.actionBuffer = "";
    } else if(tagName === Tags.content) {
      this.mode = Tags.content;
      this.setMode(this.mode);
    } else {
      console.log("Found content tag i guess: ", tagName);
      this.callbacks.onOpenTag(tagName as Tags);
    }

    this.tagStack.push(tagName)
    this.clearTextBuffer();
    this.currentTagName = "";
    this.state = ParserState.normal;
  }

  private closeTag() {
    console.log("Current tag stack in closetag is: ", this.tagStack);
    const closingTag = this.textBuffer;


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

    if(closingTag === "</TKH>" || closingTag === "</ACT>" || closingTag === "</CNT>") {
      this.mode = Tags.normal;
      this.setMode(this.mode);
    } else {
      console.log("Found content tag i guess: ", closingTag);
      this.callbacks.onCloseTag(closingTag as Tags);
    }


      this.tagStack.pop();
      this.clearStateAfterTag();
      return;

  }

  clearStateAfterTag() {
    this.clearTextBuffer();
    this.currentTagName = "";
    this.state = ParserState.normal;
  }

  processCharacter(char: string) {
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
}

function extractCodeBlockAttributes(tagName: string) {
  const langMatch = tagName.match(/lang=["']([^"']+)["']/);

  return {
    tag: "code",
    lang: langMatch ? langMatch[1] : "text",
    fullMatch: tagName,
  };
}
