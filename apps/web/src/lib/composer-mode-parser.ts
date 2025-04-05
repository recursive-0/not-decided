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

type MODE = "THOUGHT" | "EDITOR_CONTENT" | "NORMAL";

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
}

interface ParserCallbacks {
  sendTokensCallback: (tokens: string) => void;
  onOpenTag: (tag: Tags) => void;
  onCloseTag: (tag: Tags) => void;
  onTextContent: (txt: string) => void;
}

const allowed_tags = [
  "[THOUGHT]",
  "[/THOUGHT]",
  "[EDITOR_CONTENT]",
  "[/EDITOR_CONTENT]",
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
];

const isValidTag = (tag: string) => {
  return ALLOWED_TAGS.find((t) => t === tag) ? true : false;
};

const includesAllowedTags = (tag: string) => {
  return ALLOWED_TAGS.find((tag) => tag.includes(tag)) ? true : false;
};

export class ComposerModeParser {
  private mode: MODE = "NORMAL";
  private state: ParserState = ParserState.normal;
  private textBuffer: string = "";
  private currentTagName: string = "";
  private tagStack: string[] = [];
  private isActive: boolean = false;

  constructor(private callbacks: ParserCallbacks) {}

  public startStreaming() {
    this.reset();
    this.isActive = true;
  }

  private flushTextBuffer() {
    if (this.textBuffer.length === 0) return;

    if (this.mode === "THOUGHT") {
      this.callbacks.sendTokensCallback(this.textBuffer);
    } else if (this.mode === "EDITOR_CONTENT") {
      this.callbacks.onTextContent(this.textBuffer);
    }

    this.clearTextBuffer();
  }

  private clearTextBuffer() {
    this.textBuffer = "";
  }

  private reset() {
    this.mode = "NORMAL";
    this.state = ParserState.normal;
    this.clearTextBuffer();
    this.currentTagName = "";
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

    this.flushTextBuffer();
  }

  private openTag() {
    const tagName = this.currentTagName.toUpperCase();
    const originalTagText = `[${this.currentTagName}]`;
    console.log(`Parser: Attempting to open tag: "${tagName}"`);

    this.clearTextBuffer();

    if (tagName === "THOUGHT") {
      if (this.mode !== "NORMAL") {
        console.warn(
          `Parser: Opening [THOUGHT] while already inside ${this.mode}.`
        );
      }
      this.mode = "THOUGHT";
      this.tagStack.push(tagName);
      console.log(`Parser: Mode changed to THOUGHT.`);
    } else if (tagName === "EDITOR_CONTENT") {
      if (this.mode !== "NORMAL") {
        console.warn(
          `Parser: Opening [EDITOR_CONTENT] while already inside ${this.mode}.`
        );
      }
      this.mode = "EDITOR_CONTENT";
      this.tagStack.push(tagName);
      console.log(`Parser: Mode changed to EDITOR_CONTENT.`);
    } else if (this.mode === "EDITOR_CONTENT" && isValidTag(tagName)) {
      console.log(`Parser: Calling onOpenTag for EDITOR tag: ${tagName}`);
      this.tagStack.push(tagName);
      this.callbacks.onOpenTag(tagName as Tags);
    } else {
      console.warn(
        `Parser: Tag sequence "${originalTagText}" is invalid or unexpected in mode ${this.mode}. Treating as text.`
      );

      if (this.mode === "THOUGHT") {
        this.callbacks.sendTokensCallback(originalTagText);
      } else if (this.mode === "EDITOR_CONTENT") {
        this.callbacks.onTextContent(originalTagText);
      }
    }

    this.currentTagName = "";
    this.state = ParserState.normal;
  }

  private closeTag() {
    const closingTag = this.currentTagName.toUpperCase();
    const originalTagText = `[/${this.currentTagName}]`;
    console.log(`Parser: Attempting to close tag: "${closingTag}"`);
    const expectedTag =
      this.tagStack.length > 0 ? this.tagStack[this.tagStack.length - 1] : null;

    this.clearTextBuffer();

    if (!expectedTag) {
      console.warn(
        `Parser: Closing tag "${originalTagText}" found, but tag stack is empty. Ignoring.`
      );
    } else if (closingTag === expectedTag) {
      const closedTag = this.tagStack.pop()!;
      console.log(
        `Parser: Matched closing tag "${originalTagText}". Stack: [${this.tagStack.join(
          ", "
        )}]`
      );

      if (closedTag === "THOUGHT" || closedTag === "EDITOR_CONTENT") {
        this.mode = "NORMAL";
        console.log(`Parser: Mode changed to NORMAL.`);
      } else if (isValidTag(closedTag)) {
        if (
          this.mode === "EDITOR_CONTENT" ||
          (this.mode === "NORMAL" &&
            (expectedTag === "THOUGHT" || expectedTag === "EDITOR_CONTENT"))
        ) {
          console.log(
            `Parser: Calling onCloseTag for EDITOR tag: ${closedTag}`
          );
          this.callbacks.onCloseTag(closedTag as Tags);
        } else {
          console.warn(
            `Parser: Closed editor tag "[/${closedTag}]" but not in EDITOR_CONTENT mode (Mode: ${this.mode}). Stack may be corrupted.`
          );
        }
      }
    } else {
      console.warn(
        `Parser: Tag mismatch! Expected "[/${expectedTag}]", but got "${originalTagText}". Ignoring closing tag.`
      );
    }

    this.currentTagName = "";
    this.state = ParserState.normal;
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
