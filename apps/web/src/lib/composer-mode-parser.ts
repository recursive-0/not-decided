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

type MODE = "THOUGHT" | "EDITOR_CONTENT" | "NORMAL" | "ADD" | "NODE" | "DELETE" | "CODE"

export enum Tags {
  "H1" = "H1",
  "H2" = "H2",
  "H3" = "H3",
  "P" = "P",
  "B" = "B",
  "I" = "I",
  "UL" = "UL",
  "OL" = "OL",
  "LI" = "LI",
  "CODE" = "CODE",
  "LANG" = "LANG",
  "CONTENT" = "CONTENT",
  "ICODE" = "ICODE",
  "QUOTE" = "QUOTE",
  "ADD" = "ADD",
  "CHECKBOX" = "CHECKBOX",
  "NODE" = "NODE",
  "DELETE" = "DELETE",
}

interface ParserCallbacks {
  sendJsonNode: (node: string) => void;
  sendNodeToDelete: (node: string) => void;
  sendTokensCallback: (tokens: string) => void;
  sendCodeBlockNode: (codeBlock: CodeBlockNodeType) => void;
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
  setCurrentActionState: (action: CurrentActionType) => void
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
  "<CONTENT>",
  "<ICODE>",
  "<UL>",
  "<LI>",
  "<QUOTE>",
  "<OL>",
  "<CHECKBOX>",
  "<THOUGHT>",
  "</THOUGHT>",
  "<EDITOR_CONTENT>",
  "</EDITOR_CONTENT>",
  "<ADD>",
  "</ADD>",
  "<NODE>",
  "</NODE>",
  "<DELETE>",
  "</DELETE>",
];

const ALLOWED_TAGS = [
  "H1",
  "H2",
  "H3",
  "B",
  "I",
  "P",
  "CODE",
  "LANG",
  "CONTENT",
  "UL",
  "LI",
  "QUOTE",
  "OL",
  "CHECKBOX",
  "ICODE",
  "THOUGHT",
  "EDITOR_CONTENT",
  "ADD",
  "NODE",
  "DELETE",
];

export enum CurrentActionType {
  THINKING = "THINKING",
  DELETING = "DELETING",
  ADDING = "ADDING",
  NORMAL = "NORMAL"
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
  private jsonNode: string = "";
  private deleteNode: string = "";
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

    console.log("CURRNT text buffer is: ", this.textBuffer)

    if (this.state === ParserState.normal) {
      if (this.mode === "THOUGHT") {
        this.callbacks.sendTokensCallback(this.textBuffer);
      } else if (this.mode === "EDITOR_CONTENT") {
        this.callbacks.onTextContent(this.textBuffer);
      } else if(this.mode === "CODE"){
        const topTag = this.tagStack[this.tagStack.length - 1]
        if(topTag === "LANG"){
          this.codeBlockNode.lang += this.textBuffer
        } else if(topTag === "CONTENT"){
          console.log("CURRENT CONTENT IN COD BLOCK IS: ", JSON.stringify(this.codeBlockNode))
          this.codeBlockNode.content += this.textBuffer
          this.callbacks.onTextContent(this.textBuffer)
        }
      } else if (this.mode === "ADD") {
        // this.jsonNode += this.textBuffer
      } else if (this.mode === "NODE") {
        console.log("inside node mode when flushing text buffer");
        if (this.tagStack[this.tagStack.length - 2] === "ADD") {
          this.jsonNode += this.textBuffer;
        } else if (this.tagStack[this.tagStack.length - 2] === "DELETE") {
          this.deleteNode += this.textBuffer;
        } else {
          console.log(
            "strange we couldn't find ADD or DELETE while the mode is NODE"
          );
        }
      } else if (this.mode === "DELETE") {
        // do nothing here
        console.log("Emitting the LRTC event when there's nothing");
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
    this.jsonNode = "";
    this.deleteNode = "";
    this.tagStack = [];
    this.isActive = false;
  }

  private resetCodeBlockNode(){
    this.codeBlockNode = {
      lang: "",
      content: "",
    }
  }

  processChunk(chunk: string) {
    if (!this.isActive) {
      console.warn("Error: trying to parse chunk when stream is not active");
      throw new Error("Can't processs a dead stream");
    }

    console.log("CHUNK to process is: ", chunk)

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

    if (tagName === "THOUGHT") {
      this.mode = "THOUGHT";
      this.callbacks.setCurrentActionState(CurrentActionType.THINKING)
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === "EDITOR_CONTENT") {
      this.mode = "EDITOR_CONTENT";
      this.callbacks.setCurrentActionState(CurrentActionType.ADDING)
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === "ADD") {
      this.mode = "ADD";
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === "NODE") {
      this.mode = "NODE";
      this.jsonNode = "";
      this.deleteNode = "";
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === "DELETE") {
      console.log("FOUND OPENING DELETE tag");
      this.mode = "DELETE";
      this.callbacks.setCurrentActionState(CurrentActionType.DELETING)
      this.tagStack.push(tagName);
      this.clearTextBuffer();
      this.deleteNode = "";
      this.state = ParserState.normal;
      this.currentTagName = "";
      return;
    }

    if (tagName === "CODE") {
      const topTag = this.tagStack[this.tagStack.length - 1]
      console.log("FOUND CODE opening tag")
      console.log("TOP TAG IS: ", topTag)
      if(topTag === "THOUGHT"){
        console.log("Found CODE tag in thought mode so emitting text for thought mode")
        this.callbacks.sendTokensCallback(this.textBuffer)
        return
      } else {
      this.mode = "CODE"
      this.tagStack.push(tagName)
      this.clearTextBuffer()
      this.resetCodeBlockNode()
      this.state = ParserState.normal
      this.currentTagName = ""
      return
      }
    }

    // if(tagName === "LANG"){
    //   console.log("FOUND LANG opening tag")
    //   this.tagStack.push(tagName)
    //   this.clearTextBuffer()
    //   this.resetCodeBlockNode()
    //   this.state = ParserState.normal
    //   this.currentTagName = ""
    //   return
    // }

    if (this.mode === "THOUGHT") {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === "EDITOR_CONTENT") {
      this.callbacks.onOpenTag(tagName as Tags);
      this.tagStack.push(tagName);
    } else if(this.mode === 'CODE') {
      if(tagName === "CONTENT"){
        this.callbacks.sendCodeBlockNode(this.codeBlockNode)
      }
      this.tagStack.push(tagName)
    } else if (this.mode === "ADD") {
      this.tagStack.push(tagName);
    } else if (this.mode === "DELETE") {
      console.log("PUSHING NODE onto stakc");
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

    if (closingTag === "THOUGHT") {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
        this.callbacks.setCurrentActionState(CurrentActionType.NORMAL)
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

    if (closingTag === "EDITOR_CONTENT") {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
        this.callbacks.setCurrentActionState(CurrentActionType.NORMAL)
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

    if (closingTag === "NODE") {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        const parentTag = this.tagStack[this.tagStack.length - 2];
        if (parentTag === "ADD") {
          this.tagStack.pop();
          this.mode = "NORMAL";
          this.clearTextBuffer();
          this.callbacks.sendJsonNode(this.jsonNode);
          this.jsonNode = "";
          this.currentTagName = "";
          this.state = ParserState.normal;
        } else if (parentTag === "DELETE") this.tagStack.pop();
        this.mode = "NORMAL";
        this.clearTextBuffer();
        this.callbacks.sendNodeToDelete(this.deleteNode);
        this.deleteNode = "";
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

    if (closingTag === "ADD") {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
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

    if (closingTag === "DELETE") {
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "NORMAL";
        this.callbacks.setCurrentActionState(CurrentActionType.NORMAL)
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

    if(closingTag === "CODE"){
      const topTagInStack = this.tagStack[this.tagStack.length - 1];
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
        this.mode = "EDITOR_CONTENT";
        this.clearTextBuffer();
        this.resetCodeBlockNode()
        this.callbacks.onCloseTag(Tags.CODE)
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

    if (this.mode === "THOUGHT") {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === "EDITOR_CONTENT") {
      if (topTagInStack === closingTag) {
        this.callbacks.onCloseTag(closingTag as Tags);
        this.tagStack.pop();
      } else {
        this.callbacks.onTextContent(this.textBuffer);
      }
    } else if(this.mode === "CODE"){
      if(closingTag === "LANG" && topTagInStack === "LANG"){
        this.tagStack.pop()
      } else if(closingTag === "CONTENT"){
        this.tagStack.pop()
      } else if(closingTag === "CODE" && topTagInStack === "CODE"){
        this.tagStack.pop()
        this.mode = "NORMAL"
      }
    } else if (this.mode === "ADD") {
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
      } else {
        console.log(
          `We were expecting ${closingTag} but found ${topTagInStack}`
        );
      }
    } else if (this.mode === "DELETE") {
      if (topTagInStack === closingTag) {
        this.tagStack.pop();
      } else {
        console.log(
          `We were expecting ${closingTag} but found ${topTagInStack}`
        );
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