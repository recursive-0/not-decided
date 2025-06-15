import { useWrisorStore } from "@/store/wrisor";
import { TypeEnum, Mode, ActionMessageType, OperationType } from "@/types/stream";
import { CodeBlockNodeType, ComposerModeParser } from "@/lib/composer-mode-parser";
import { EditorView } from "prosemirror-view";
import { Renderer } from "@/lib/renderer";
import { Tags } from "@/types/editor";
import { SuggestionHighlightMetaDataType, suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";


interface MessageType {
	type: TypeEnum,
    data?: string,
    op: OperationType,
    targetId?: string,
    actionId?: string,
}

interface ContentChunkMessageType {
    type: TypeEnum,
    data: string
}

interface OrchestratorProps {
    callbacks: Callbacks,
    editorView: EditorView
}


interface Callbacks {
    onMarkdownChunk: (chunk: string) => void;
    onAction: (action: ActionMessageType) => void;

}

export class StreamOrchestrator {
	private buffer: string = '';
    private isStreamActive: boolean = false
    private view: EditorView | null = null
    private thoughtBuffer: string = ""
    private contentBuffer: string = ""
    private composerModeParser: ComposerModeParser | null = null
    private renderer: Renderer | null = null
    private callbacks: Callbacks

    constructor(props: OrchestratorProps){
        const { editorView, callbacks } = props
        this.view = editorView
        this.callbacks = callbacks
        this.renderer = new Renderer(this.view)
        this.composerModeParser = new ComposerModeParser({
            onOpenTag: (tag: Tags) => this.renderer!.onOpenTag(tag),
            onCloseTag: (tag: Tags) => this.renderer?.onCloseTag(tag),
            onTextContent: (chunk: string) => this.renderer?.onTextContent(chunk),
            onCodeBlock: (code: CodeBlockNodeType) => this.renderer?.onCodeBlock(code)
        })

    }

    public reset(){
        this.buffer = ""
        this.thoughtBuffer = ""
        this.contentBuffer = ""
    }

    setMode(newMode: Mode){
        console.log(this.isStreamActive)
        const { setCurrentMode } = useWrisorStore.getState()
        setCurrentMode(newMode)
    }

	public processChunk(chunk: string) {
  console.log("CHUNK IS: ", chunk)
  
  let i = 0;
  while (i < chunk.length) {
    this.buffer += chunk[i];
    
    try {
      const message = JSON.parse(this.buffer);
      console.log("JSON parse successful: ", message);
      this.routeMessage(message);
      
      // Clear buffer and continue with next character
      this.buffer = "";
      i++;
    } catch {
      // JSON not complete yet, continue adding characters
      i++;
    }
  }
}


	routeMessage(message: MessageType) {
        const type = message.type

        switch(type){
            // thought stream start, change the mode
            case TypeEnum.tss:
            this.setMode(Mode.thought)
            break;
            case TypeEnum.tc:
            this.thoughtChunkHandler(message)
            break;
            case TypeEnum.tse:
            this.setMode(Mode.normal)
            break;
            case TypeEnum.act:
            console.log("Act message is: ", message)
            this.processAction(message as ActionMessageType)
            break;
            case TypeEnum.css:
            this.setMode(Mode.content);
            console.log("Content Stream starts is: ", message)
            // this.setCurrentAction(message as ContentStreamMessageType)
            break;
            case TypeEnum.cc:
            console.log("content chunk is: ", message)
            this.processContentChunkMessage(message as ContentChunkMessageType)
            break;
            case TypeEnum.cse:
            this.setMode(Mode.normal)
            console.log("Content Stream end is: ", message)
            break;
            default:
            console.error("Invalid message type", message)
            break;
            
                
        }
    } 

    public startStreaming(){
        this.reset()
        this.isStreamActive = true
    }


    public stopStreaming(){
        this.reset()
        this.isStreamActive = false
    }

    thoughtChunkHandler(thoughtChunk: MessageType){
        const { data } = thoughtChunk
        if(data){
            this.thoughtBuffer += data
            this.callbacks.onMarkdownChunk(data)
        } else {
            console.error("Tried to emit markdown chunk but data not found")
        }
    }

    // process actions here and set pending action in renderer for accurate insertions
    processAction(action: ActionMessageType){
        console.log("Inside the process action of processor", action)
        const { op, targetId } = action
        if(op === OperationType.delete || op === OperationType.replace){
            const metaData: SuggestionHighlightMetaDataType = {
                metaData: {
                    nodeId: targetId,
                type: "deletion-suggestion"
                }
            }

            if(!this.view) return
            const tr = this.view?.state.tr
            console.log("Setting new transaction", tr)
            tr?.setMeta(suggestionHighlightPluginKey, metaData)
            this.view?.dispatch(tr)
        }

        this.renderer?.setPendingAction(action)
        // this.callbacks.onAction(action)
    }

    processContentChunkMessage(message: ContentChunkMessageType){
            const { data } = message
            this.contentBuffer += data

            this.composerModeParser!.processChunk(data)
    }
}
