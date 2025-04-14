

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

type MODE = "THOUGHT" | "EDITOR_CONTENT" | "NORMAL" | "TARGETS" | "NODE" | "LRTC" | "CTRLD"

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
  "ICODE" = "ICODE",
  "QUOTE" = "QUOTE",
  "CHECKBOX" = "CHECKBOX",
  "NODE" = "NODE",
  "CTRLD" = "CTRLD",
  "LRTC" = "LRTC"
}

interface ParserCallbacks {
  sendJsonNode: (node: string) => void,
  sendNodeToDelete: (node: string) => void,
  sendTokensCallback: (tokens: string) => void;
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
}

const all_tags = [
    "[H1]",
    "[H2]",
    "[H3]",
    "[B]",
    "[I]",
    "[P]",
    "[CODE]",
    "[ICODE]",
    "[UL]",
    "[LI]",
    "[QUOTE]",
    "[OL]",
    "[CHECKBOX]",
  "[THOUGHT]",
  "[/THOUGHT]",
  "[EDITOR_CONTENT]",
  "[/EDITOR_CONTENT]",
  "[TARGETS]",
  "[/TARGETS]",
  "[NODE]",
  "[/NODE]",
  "[LRTC]",
  "[/LRTC]",
  "[CTRLD]",
  "[/CTRLD]"
];

const ALLOWED_TAGS = [
  "H1",
  "H2",
  "H3",
  "B",
  "I",
  "P",
  "CODE",
  "UL",
  "LI",
  "QUOTE",
  "OL",
  "CHECKBOX",
  "ICODE",
  "THOUGHT",
  "EDITOR_CONTENT",
  "TARGETS",
  "NODE",
  "CTRLD",
  "LRTC"
];

const isValidTag = (tag: string) => {
  return ALLOWED_TAGS.find((t) => t === tag) ? true : false;
};

const includesAllowedTags = (tag: string) => {
  return all_tags.find((t) => t.includes(tag)) ? true : false;
};

export class ComposerModeParser {
  private mode: MODE = "NORMAL";
  private state: ParserState = ParserState.normal;
  private textBuffer: string = "";
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private isActive: boolean = false;
  private jsonNode: string = ""
  private deleteNode: string = ""

  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.reset();
    this.isActive = true;
  }

  private flushTextBuffer() {
    if (this.textBuffer.length === 0) return;

    if(this.state === ParserState.normal){
        if (this.mode === "THOUGHT") {
            this.callbacks.sendTokensCallback(this.textBuffer);
          } else if (this.mode === "EDITOR_CONTENT") {
            this.callbacks.onTextContent(this.textBuffer);
          } else if (this.mode === "TARGETS"){
            // this.jsonNode += this.textBuffer

          } else if(this.mode === "NODE"){
            this.jsonNode += this.textBuffer
          } else if(this.mode === "CTRLD") {
            console.log("Inside flushing ctrld", this.textBuffer)
            this.deleteNode += this.textBuffer
          } else if(this.mode === "LRTC"){
            // do nothing here
            console.log("Emitting the LRTC event when there's nothing")
          } else {
              console.warn("FLUSHING TEXT BUFFER BUT MODE IS NORMAL!!!")
              this.callbacks.sendTokensCallback(this.textBuffer)
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
    this.jsonNode = ""
    this.deleteNode = ""
    this.tagStack = [];
    this.isActive = false;
  }

  processChunk(chunk: string) {

    if(!this.isActive){
        console.warn("Error: trying to parse chunk when stream is not active")
        throw new Error("Can't processs a dead stream")
    }

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.processEachCharacter(char);
    }

    console.log("TAG STACK IS: ", this.tagStack)

    this.flushTextBuffer();
  }

  private openTag() {
    const tagName = this.currentTagName.toUpperCase();
    const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    if(!isValidTag(tagName)){
        this.flushTextBuffer()
        this.state = ParserState.normal
        this.currentTagName = ""
        return
    }

    if(tagName === "THOUGHT"){
        this.mode = "THOUGHT"
        this.tagStack.push(tagName)
        this.clearTextBuffer()
        this.state = ParserState.normal
        this.currentTagName = ""
        return
    }

    if(tagName === "EDITOR_CONTENT"){
        this.mode = "EDITOR_CONTENT"
        this.tagStack.push(tagName)
        this.clearTextBuffer()
        this.state = ParserState.normal
        this.currentTagName = ""
        return
    }

    if(tagName === "TARGETS"){
        this.mode = "TARGETS"
        this.tagStack.push(tagName)
        this.clearTextBuffer()
        this.state = ParserState.normal
        this.currentTagName = ""
        return
    }

    if(tagName === "NODE"){
      this.mode = "NODE"
      this.jsonNode = ""
      this.tagStack.push(tagName)
      this.clearTextBuffer()
      this.state = ParserState.normal
      this.currentTagName = ""
      return
    }

    if(tagName === "LRTC"){
      console.log("FOUND OPENING LRTC tag")
      this.mode = "LRTC"
      this.tagStack.push(tagName)
      this.clearTextBuffer()
      this.deleteNode = ""
      this.state = ParserState.normal
      this.currentTagName = ""
      return
  }


  if(tagName === "CTRLD"){
    this.mode = "CTRLD"
    this.deleteNode = ""
    this.tagStack.push(tagName)
    this.clearTextBuffer()
    this.state = ParserState.normal
    this.currentTagName = ""
    return
  }

    if(this.mode === "THOUGHT"){
        this.callbacks.sendTokensCallback(this.textBuffer)
    } else if(this.mode === "EDITOR_CONTENT"){
        this.callbacks.onOpenTag(tagName as Tags)
        this.tagStack.push(tagName)
    } else if(this.mode === "TARGETS"){
        this.tagStack.push(tagName)
    } else if(this.mode === "LRTC") {
      console.log("PUSHING CTRLD onto stakc")
      this.tagStack.push(tagName)
    } else {
        this.flushTextBuffer()
    }

    this.currentTagName = ""
    this.state = ParserState.normal
    this.clearTextBuffer();
  }

  private closeTag() {
    const closingTag = this.currentTagName.toUpperCase();
    const originalTagText = `[/${this.currentTagName}]`;
    const topTagInStack = this.tagStack[this.tagStack.length - 1]

    if(!isValidTag(closingTag)){
        this.flushTextBuffer()
        this.state = ParserState.normal
        this.currentTagName = ""
        return
    }

    if(closingTag === "THOUGHT"){
        const topTagInStack = this.tagStack[this.tagStack.length - 1]
        if(topTagInStack === closingTag){
            this.tagStack.pop()
            this.mode = "NORMAL"
            this.clearTextBuffer()
            this.currentTagName = ""
            this.state = ParserState.normal
        } else {
            console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
            throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
        }

        return
    }

    if(closingTag === "EDITOR_CONTENT"){
        const topTagInStack = this.tagStack[this.tagStack.length - 1]
        if(topTagInStack === closingTag){
            this.tagStack.pop()
            this.mode = "NORMAL"
            this.clearTextBuffer()
            this.currentTagName = ""
            this.state = ParserState.normal
        } else {
            console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
            throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
        }

        return
    }

    if(closingTag === "NODE"){
      const topTagInStack = this.tagStack[this.tagStack.length - 1]
      if(topTagInStack === closingTag){
          this.tagStack.pop()
          this.mode = "NORMAL"
          this.clearTextBuffer()
          this.callbacks.sendJsonNode(this.jsonNode)
          this.jsonNode = ""
          this.currentTagName = ""
          this.state = ParserState.normal
      } else {
          console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
          throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
      }

      return
  } 

    if(closingTag === "TARGETS"){
      const topTagInStack = this.tagStack[this.tagStack.length - 1]
      if(topTagInStack === closingTag){
          this.tagStack.pop()
          this.mode = "NORMAL"
          this.clearTextBuffer()
          this.currentTagName = ""
          this.state = ParserState.normal
      } else {
          console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
          throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
      }

      return
  }

  if(closingTag === "CTRLD"){
    const topTagInStack = this.tagStack[this.tagStack.length - 1]
    if(topTagInStack === closingTag){
        this.tagStack.pop()
        this.mode = "NORMAL"
        this.clearTextBuffer()
        console.log("SENDING DELETE NODE: ", this.deleteNode)
        this.callbacks.sendNodeToDelete(this.deleteNode)
        this.deleteNode = ""
        this.currentTagName = ""
        this.state = ParserState.normal
    } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
        throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
    }

    return
} 

  if(closingTag === "LRTC"){
    const topTagInStack = this.tagStack[this.tagStack.length - 1]
    if(topTagInStack === closingTag){
        this.tagStack.pop()
        this.mode = "NORMAL"
        this.clearTextBuffer()
        this.currentTagName = ""
        this.state = ParserState.normal
    } else {
        console.warn(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
        throw new Error(`EXPECTED ${closingTag} TAG but Found ${topTagInStack}`)
    }

    return
}

    if(this.mode === "THOUGHT"){
        this.callbacks.sendTokensCallback(this.textBuffer)
    } else if(this.mode === "EDITOR_CONTENT"){
        if(topTagInStack === closingTag){
            this.callbacks.onCloseTag(closingTag as Tags)
            this.tagStack.pop()
        } else {
            this.callbacks.onTextContent(this.textBuffer)
        }
    } else if(this.mode === "TARGETS"){
        if(topTagInStack === closingTag){
          this.tagStack.pop()
        } else {
          console.log(`We were expecting ${closingTag} but found ${topTagInStack}`)
        }
    } else if(this.mode === "LRTC") {
      if(topTagInStack === closingTag){
        this.tagStack.pop()
      } else {
        console.log(`We were expecting ${closingTag} but found ${topTagInStack}`)
      }
    }
     else {
        this.flushTextBuffer()
    }


    this.currentTagName = ""
    this.state = ParserState.normal
    this.clearTextBuffer();

  }

  processEachCharacter(char: string) {
    switch (this.state) {
      case ParserState.normal:
        if (char === "[") {
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
        if (char === "]") {
          this.textBuffer += char;
          this.openTag();
        } else {
          this.textBuffer += char;
          this.currentTagName += char;
        }
        break;
      case ParserState.closing_tag_start:
        if (char === "]") {
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


// const thoughtTokens: string[] = [];
// const editorOpenTags: string[] = [];
// const editorCloseTags: string[] = [];
// const editorTexts: string[] = [];

// const callbacks: ParserCallbacks = {
//   sendTokensCallback: (tokens: string) => {
//     console.log("--> Received THOUGHT Tokens:", JSON.stringify(tokens));
//     thoughtTokens.push(tokens);
//   },
//   onOpenTag: (tag: Tags) => {
//     console.log("--> Received EDITOR Open Tag:", tag);
//     editorOpenTags.push(tag);
//   },
//   onCloseTag: (tag: Tags) => {
//     console.log("--> Received EDITOR Close Tag:", tag);
//     editorCloseTags.push(tag);
//   },
//   onTextContent: (txt: string) => {
//     console.log("--> Received EDITOR Text:", JSON.stringify(txt));
//     editorTexts.push(txt);
//   },
// };

// const composerParser = new ComposerModeParser(callbacks);

// function runComposerTest(testName: string, chunks: string[]) {
//   console.log(`\n--- Running Composer Test: ${testName} ---`);

//   thoughtTokens.length = 0;
//   editorOpenTags.length = 0;
//   editorCloseTags.length = 0;
//   editorTexts.length = 0;

//   composerParser.startStreaming();

//   chunks.forEach((chunk, index) => {
//     console.log(`Processing chunk ${index + 1}:`, JSON.stringify(chunk));
//     composerParser.processChunk(chunk);
//   });

//   composerParser.stopStreaming();

//   console.log(`\n--- Results for ${testName} ---`);
//   console.log("Thought Tokens:", thoughtTokens);
//   console.log("Editor Open Tags:", editorOpenTags);
//   console.log("Editor Close Tags:", editorCloseTags);
//   console.log("Editor Texts:", editorTexts);
//   console.log(`--- Finished Composer Test: ${testName} ---\n`);
// }

// const composer_test1_chunks = ["[THOUGHT]Let's start thinking.[/THOUGHT]"];
// const composer_test2_chunks = [
//   "[EDITOR_CONTENT]Just some text.[/EDITOR_CONTENT]",
// ];
// const composer_test3_chunks = [
//   "[EDITOR_CONTENT][H1]Title[/H1][P]Paragraph with [B]bold[/B] text.[/P][/EDITOR_CONTENT]",
// ];
// const composer_test4_chunks = [
//   "[THOUGHT]Okay, planning to add a title and paragraph.",
//   "[/THOUGHT]",
//   "[EDITOR_CONTENT]",
//   "[H1]My Doc",
//   "[/H1]",
//   "[P]This is the first paragraph.",
//   "[/P]",
//   "[/EDITOR_CONTENT]",
//   "[THOUGHT]Now adding a list.",
//   "[/THOUGHT][EDITOR_CONTENT][UL][LI]Item 1[/LI]",
//   "[LI]Item 2[/LI][/UL]",
//   "[/EDITOR_CONTENT]",
// ];
// const composer_test5_chunks = [
//   "[THOUGHT]Split th",
//   "ought[/THOUGHT][EDITOR_CONT",
//   "ENT][P]Split Para",
//   "graph[/P][/EDITOR_CONTENT]",
// ];
// const composer_test6_chunks = [
//   "[THOUGHT]",
//   "[/THOUGHT]",
//   "[EDITOR_CONTENT]",
//   "[/EDITOR_CONTENT]",
// ];
// const composer_test7_chunks = ["[THOUGHT]This thought is never closed..."];
// const composer_test8_chunks = ["[EDITOR_CONTENT][H1]Unclosed title"];
// const composer_test9_chunks = [
//   "[EDITOR_CONTENT][H1]Title[/H1][P]Mismatched [B]bold[/I] text.[/P][/EDITOR_CONTENT]",
// ];
// const composer_test10_chunks = [
//   "[INVALID_OUTER]Some text[/INVALID_OUTER][THOUGHT]Valid thought.[/THOUGHT]",
// ];
// const composer_test11_chunks = [
//   "[THOUGHT]Thought with [H1]tags[/H1] inside.[/THOUGHT]",
// ];
// const composer_test12_chunks = [
//   "[EDITOR_CONTENT][INVALID]Invalid inner[/INVALID][/EDITOR_CONTENT]",
// ];

// runComposerTest("Composer Test 1: Basic Thought", composer_test1_chunks);
// runComposerTest("Composer Test 2: Basic Editor Content", composer_test2_chunks);
// runComposerTest(
//   "Composer Test 3: Editor Content with Tags",
//   composer_test3_chunks
// );
// runComposerTest("Composer Test 4: Mixed Content", composer_test4_chunks);
// runComposerTest("Composer Test 5: Split Content", composer_test5_chunks);
// runComposerTest("Composer Test 6: Empty Blocks", composer_test6_chunks);
// runComposerTest(
//   "Composer Test 7: Incomplete Thought Block",
//   composer_test7_chunks
// );
// runComposerTest(
//   "Composer Test 8: Incomplete Editor Block (Inner Tag)",
//   composer_test8_chunks
// );
// runComposerTest(
//   "Composer Test 9: Mismatched Inner Tags",
//   composer_test9_chunks
// );
// runComposerTest("Composer Test 10: Invalid Outer Tag", composer_test10_chunks);
// runComposerTest(
//   "Composer Test 11: Inner Tags Inside Thought",
//   composer_test11_chunks
// );
// runComposerTest("Composer Test 12: Invalid Inner Tag", composer_test12_chunks);
