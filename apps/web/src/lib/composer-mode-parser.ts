
import type { OperationType } from '@/types/editor';
import { MODE, Tags } from "@/types/editor";


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
  onOperation: (operation: OperationType) => void;
  sendTokensCallback: (tokens: string) => void;
  sendCodeBlockNode: (codeBlock: CodeBlockNodeType) => void;
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
  setCurrentActionState: (action: CurrentActionType) => void;
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
  "<content>",
  "<icode>",
  "<ul>",
  "<li>",
  "<quote>",
  "<ol>",
  "<checkbox>",
  "<thinking>",
  "</thinking>",
  "<operation>",
  "</operation>",
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
  "content",
  "icode",
  "quote",
  "add",
  "checkbox",
  "node",
  "delete",
  "operation",
  "thinking",
];

export enum CurrentActionType {
  thinking = "thinking",
  deleting = "deleting", 
  adding = "adding",
  normal = "normal",
}

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
  private mode: MODE = Tags.normal;
  private state: ParserState = ParserState.normal;
  private textBuffer: string = "";
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private isActive: boolean = false;
  private operationDataJsonString: string = "";
  private codeBlockNode: CodeBlockNodeType = {
    lang: "",
    content: "",
  };

  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.reset();
    this.isActive = true;
  }

  private flushTextBuffer() {
    if (this.textBuffer.length === 0) return;

    let textToEmit: string;
  if (this.mode === Tags.code) {
    textToEmit = this.textBuffer;
  } else {
    textToEmit = this.textBuffer.replace(/[\n\r\t]/g, "");
  }

  if (textToEmit.length === 0) {
    this.clearTextBuffer();
    return;
  }

    console.log("CURRNT text buffer is: ", this.textBuffer);

    if (this.state === ParserState.normal) {
      if (this.mode === Tags.thinking) {
        this.callbacks.sendTokensCallback(this.textBuffer);
      } else if (this.mode === Tags.operation) {
        this.operationDataJsonString += this.textBuffer;
      } else if (this.mode === Tags.content) {
        this.callbacks.onTextContent(this.textBuffer);
      } else if (this.mode === Tags.code) {
        this.codeBlockNode.content += this.textBuffer;
      } else {
        console.warn("FLUSHING TEXT BUFFER BUT MODE IS NORMAL!!!");
        this.callbacks.sendTokensCallback(this.textBuffer);
      }

      this.clearTextBuffer();
    }
  }

  private clearTextBuffer() {
    this.textBuffer = "";
  }

  private reset() {
    this.mode = Tags.normal;
    this.state = ParserState.normal;
    this.clearTextBuffer();
    this.currentTagName = "";
    this.operationDataJsonString = "";
    this.tagStack = [];
    this.isActive = false;
  }

  private resetCodeBlockNode() {
    this.codeBlockNode = {
      lang: "",
      content: "",
    };
  }

  private resetOperationData() {
    this.operationDataJsonString = "";
  }

  processChunk(chunk: string) {
    if (!this.isActive) {
      console.warn("Error: trying to parse chunk when stream is not active");
      throw new Error("Can't processs a dead stream");
    }

    console.log("CHUNK to process is: ", chunk);

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.processEachCharacter(char);
    }

    console.log("TAG STACK IS: ", this.tagStack);

    this.flushTextBuffer();
  }

  private openTag() {
    const tagName = this.currentTagName.toLowerCase()
    // const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    if (tagName.includes("code lang")) {
      const topTag = this.tagStack[this.tagStack.length - 1];
      console.log("FOUND CODE opening tag");
      console.log("TOP TAG IS: ", topTag);
      if (topTag === Tags.thinking) {
        console.log(
          "Found CODE tag in thought mode so emitting text for thought mode"
        );
        this.callbacks.sendTokensCallback(this.textBuffer);
        return;
      } else {
        this.mode = Tags.code;
        this.tagStack.push(Tags.code);
        this.clearTextBuffer();
        this.resetCodeBlockNode();
        const codeBlockAttributes = extractCodeBlockAttributes(tagName);
        this.codeBlockNode.lang = codeBlockAttributes.lang || "text";
        this.state = ParserState.normal;
        this.currentTagName = "";
        return;
      }
    }

    if (!isValidTag(tagName)) {
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.thinking) {
      this.mode = Tags.thinking;
      this.callbacks.setCurrentActionState(CurrentActionType.thinking);
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.operation) {
      this.mode = Tags.operation;
      this.resetOperationData();
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.content) {
      this.mode = Tags.content;
      this.callbacks.setCurrentActionState(CurrentActionType.adding);
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (this.mode === Tags.thinking) {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === Tags.content) {
      this.callbacks.onOpenTag(tagName as Tags);
      this.tagStack.push(tagName);
    } else if (this.mode === Tags.code) {
      this.tagStack.push(tagName);
    } else {
      this.flushTextBuffer();
    }

    this.currentTagName = "";
    this.state = ParserState.normal;
    this.clearTextBuffer();
  }

  private closeTag() {
    console.log("Current tag stack in closetag is: ", this.tagStack)
    const closingTag = this.currentTagName.toLowerCase()
    // const originalTagText = `[/${this.currentTagName}]`;
    const topTagInStack = this.tagStack[this.tagStack.length - 1];

    if (!isValidTag(closingTag)) {
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (closingTag === Tags.thinking) {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = Tags.normal;
        this.callbacks.setCurrentActionState(CurrentActionType.normal);
        this.clearTextBuffer();
        this.currentTagName = "";
        this.state = ParserState.normal;
      } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`);
        throw new Error(
          `EXPECTED ${closingTag} TAG but Found ${topTagInStack}`
        );
      }

      return;
    }

    if(closingTag === Tags.operation){
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = Tags.normal;
        const validOperationJson = JSON.parse(this.operationDataJsonString)
        if(validOperationJson){
          this.callbacks.onOperation(validOperationJson)
        } else {
          throw new Error(`Error parsing the operation data: ", ${this.operationDataJsonString}`)
        }
        this.clearTextBuffer();
        this.currentTagName = "";
        this.state = ParserState.normal;
      } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`);
        throw new Error(
          `EXPECTED ${closingTag} TAG but Found ${topTagInStack}`
        );
      }

      return;
    }

    if (closingTag === Tags.content) {
      console.log("CLOSING TAG: ", closingTag)
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = Tags.normal;
        this.callbacks.setCurrentActionState(CurrentActionType.normal);
        this.currentTagName = "";
        this.state = ParserState.normal;
        this.clearTextBuffer();
      } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`);
        throw new Error(
          `EXPECTED ${closingTag} TAG but Found ${topTagInStack}`
        );
      }

      return;
    }

    if (closingTag === Tags.code) {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = Tags.content;
        this.clearTextBuffer();
        this.callbacks.sendCodeBlockNode(this.codeBlockNode)
        this.resetCodeBlockNode();
        this.callbacks.onCloseTag(Tags.code);
        this.currentTagName = "";
        this.state = ParserState.normal;
      } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`);
        throw new Error(
          `EXPECTED ${closingTag} TAG but Found ${topTagInStack}`
        );
      }

      return;
    }

    if (this.mode === Tags.thinking) {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === Tags.content) {
      console.log("Current tag stack is: ", this.tagStack)
      console.log("Inside content mode", closingTag)
      if (topTagInStack === closingTag) {
        this.callbacks.onCloseTag(topTagInStack as Tags);
        this.tagStack.pop();
      } else {
        this.callbacks.onTextContent(this.textBuffer);
      }
    } else if (this.mode === Tags.code) {
      // if (closingTag === Tags && topTagInStack === Tags.) {
      //   // this.callbacks.sendCodeBlockNode(this.codeBlockNode)
      //   this.tagStack.pop();
      // } else if (closingTag === Tags.VAL) {
      //   this.tagStack.pop();
      // } else if (closingTag === Tags.CODE && topTagInStack === Tags.CODE) {
      //   this.tagStack.pop();
      //   this.mode = "NORMAL";
      // }
    } else {
      this.flushTextBuffer();
    }

    this.currentTagName = "";
    this.state = ParserState.normal;
    this.clearTextBuffer();
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
    tag: 'code',
    lang: langMatch ? langMatch[1] : 'text', 
    fullMatch: tagName
  };
}