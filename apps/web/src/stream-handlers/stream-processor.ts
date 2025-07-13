import {
    CodeBlockNodeType,
    ComposerModeParser,
} from "@/lib/composer-mode-parser";
import { Renderer } from "@/lib/renderer";
import {
    SuggestionHighlightMetaDataType,
    suggestionHighlightPluginKey,
} from "@/plugins/suggestion-highlight-plugin";
import { useWrisorStore } from "@/store/wrisor";
import { Tags } from "@/types/editor";
import {
    ActionMessageType,
    Mode,
    OperationType,
    TypeEnum,
} from "@/types/stream";
import { EditorView } from "prosemirror-view";

interface MessageType {
  type: TypeEnum;
  data?: string;
  op: OperationType;
  targetId?: string;
  actionId?: string;
}

interface ContentChunkMessageType {
  type: TypeEnum;
  data: string;
}

interface OrchestratorProps {
  callbacks: Callbacks;
  editorView: EditorView;
}

interface Callbacks {
  onMarkdownChunk: (chunk: string) => void;
  onAction: (action: ActionMessageType) => void;
}

export class StreamProcessor {
  private buffer: string = "";
  private isStreamActive: boolean = false;
  private view: EditorView | null = null;
  private thoughtBuffer: string = "";
  private contentBuffer: string = "";
  private actionBuffer: string = "";
  private composerModeParser: ComposerModeParser | null = null;
  private renderer: Renderer | null = null;
  private callbacks: Callbacks;

  constructor(props: OrchestratorProps) {
    const { editorView, callbacks } = props;
    this.view = editorView;
    this.callbacks = callbacks;
    this.renderer = new Renderer(this.view);
    this.composerModeParser = new ComposerModeParser({
      onOpenTag: (tag: Tags) => this.renderer!.onOpenTag(tag),
      onCloseTag: (tag: Tags) => this.renderer?.onCloseTag(tag),
      onTextContent: (chunk: string) => this.renderer?.onTextContent(chunk),
      onCodeBlock: (code: CodeBlockNodeType) =>
        this.renderer?.onCodeBlock(code),
    });
  }

  public reset() {
    this.buffer = "";
    this.thoughtBuffer = "";
    this.contentBuffer = "";
    this.actionBuffer = "";
  }

  setMode(newMode: Mode) {
    console.log(this.isStreamActive);
    const { setCurrentMode } = useWrisorStore.getState();
    setCurrentMode(newMode);
  }

  public processChunk(chunk: string) {
    console.log("CHUNK IS: ", chunk);

    if(!this.isStreamActive) {
      console.warn("Error: trying to process chunk when stream is not active");
      throw new Error("Can't processs a dead stream");
    }

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.buffer += char;
      this.processCharacter(char);
    }
  }


  public startStreaming() {
    this.reset();
    this.isStreamActive = true;
  }

  public stopStreaming() {
    this.reset();
    this.isStreamActive = false;
  }


  public processCharacter(char: string) {

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

}
