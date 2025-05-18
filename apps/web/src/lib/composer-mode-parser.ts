
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
  "<H1>",
  "<H2>",
  "<H3>",
  "<B>",
  "<I>",
  "<P>",
  "<CODE>",
  "<LANG>",
  "<VAL>",
  "</VAL>",
  "<CONTENT>",
  "<ICODE>",
  "<UL>",
  "<LI>",
  "<QUOTE>",
  "<OL>",
  "<CHECKBOX>",
  "<THINKING>",
  "</THINKING>",
  "<OPERATION>",
  "</OPERATION>",
];

const ALLOWED_TAGS = [
  "H1",
  "H2",
  "H3",
  "P",
  "B",
  "I",
  "UL",
  "OL",
  "LI",
  "CODE",
  "LANG",
  "VAL",
"CONTENT",
  "ICODE",
  "QUOTE",
  "ADD",
  "CHECKBOX",
  "NODE",
  "DELETE",
  "OPERATION",
  "THINKING",
];

export enum CurrentActionType {
  THINKING = "THINKING",
  DELETING = "DELETING",
  ADDING = "ADDING",
  NORMAL = "NORMAL",
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
  private mode: MODE = "NORMAL";
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

    console.log("CURRNT text buffer is: ", this.textBuffer);

    if (this.state === ParserState.normal) {
      if (this.mode === Tags.THINKING) {
        this.callbacks.sendTokensCallback(this.textBuffer);
      } else if (this.mode === Tags.OPERATION) {
        this.operationDataJsonString += this.textBuffer;
      } else if (this.mode === Tags.CONTENT) {
        this.callbacks.onTextContent(this.textBuffer);
      } else if (this.mode === Tags.CODE) {
        const topTag = this.tagStack[this.tagStack.length - 1];
        if (topTag === "LANG") {
          this.codeBlockNode.lang += this.textBuffer;
        } else if (topTag === "VAL") {
          console.log(
            "CURRENT CONTENT IN COD BLOCK IS: ",
            JSON.stringify(this.codeBlockNode)
          );
          this.codeBlockNode.content += this.textBuffer;
          // this.callbacks.onTextContent(this.textBuffer);
        }
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
    this.mode = "NORMAL";
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
    const tagName = this.currentTagName.toUpperCase();
    // const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    if (!isValidTag(tagName)) {
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.THINKING) {
      this.mode = Tags.THINKING;
      this.callbacks.setCurrentActionState(CurrentActionType.THINKING);
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.OPERATION) {
      this.mode = Tags.OPERATION;
      this.resetOperationData();
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.CONTENT) {
      this.mode = Tags.CONTENT;
      this.callbacks.setCurrentActionState(CurrentActionType.ADDING);
      this.callbacks.onOpenTag(tagName)
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === Tags.CODE) {
      const topTag = this.tagStack[this.tagStack.length - 1];
      console.log("FOUND CODE opening tag");
      console.log("TOP TAG IS: ", topTag);
      if (topTag === Tags.THINKING) {
        console.log(
          "Found CODE tag in thought mode so emitting text for thought mode"
        );
        this.callbacks.sendTokensCallback(this.textBuffer);
        return;
      } else {
        this.mode = Tags.CODE;
        this.tagStack.push(tagName);
        this.clearTextBuffer();
        this.resetCodeBlockNode();
        this.state = ParserState.normal;
        this.currentTagName = "";
        return;
      }
    }

    if (this.mode === Tags.THINKING) {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === Tags.CONTENT) {
      this.callbacks.onOpenTag(tagName as Tags);
      this.tagStack.push(tagName);
    } else if (this.mode === Tags.CODE) {
      this.tagStack.push(tagName);
    } else {
      this.flushTextBuffer();
    }

    this.currentTagName = "";
    this.state = ParserState.normal;
    this.clearTextBuffer();
  }

  private closeTag() {
    const closingTag = this.currentTagName.toUpperCase();
    // const originalTagText = `[/${this.currentTagName}]`;
    const topTagInStack = this.tagStack[this.tagStack.length - 1];

    if (!isValidTag(closingTag)) {
      this.flushTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (closingTag === Tags.THINKING) {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
        this.callbacks.setCurrentActionState(CurrentActionType.NORMAL);
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

    if(closingTag === Tags.OPERATION){
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
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

    if (closingTag === Tags.CONTENT) {
      console.log("CLOSING TAG: ", closingTag)
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
        this.callbacks.setCurrentActionState(CurrentActionType.NORMAL);
        this.callbacks.onCloseTag(closingTag)
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

    if (closingTag === Tags.CODE) {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = Tags.CONTENT;
        this.clearTextBuffer();
        this.callbacks.sendCodeBlockNode(this.codeBlockNode)
        this.resetCodeBlockNode();
        this.callbacks.onCloseTag(Tags.CODE);
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

    if (this.mode === Tags.THINKING) {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === Tags.CONTENT) {
      console.log("Current tag stack is: ", this.tagStack)
      console.log("Inside content mode", closingTag)
      if (topTagInStack === closingTag) {
        this.callbacks.onCloseTag(topTagInStack as Tags);
        this.tagStack.pop();
      } else {
        this.callbacks.onTextContent(this.textBuffer);
      }
    } else if (this.mode === Tags.CODE) {
      if (closingTag === Tags.LANG && topTagInStack === Tags.LANG) {
        // this.callbacks.sendCodeBlockNode(this.codeBlockNode)
        this.tagStack.pop();
      } else if (closingTag === Tags.VAL) {
        this.tagStack.pop();
      } else if (closingTag === Tags.CODE && topTagInStack === Tags.CODE) {
        this.tagStack.pop();
        this.mode = "NORMAL";
      }
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
