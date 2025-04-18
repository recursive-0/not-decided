"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState, Selection, TextSelection } from "prosemirror-state";
import {
  extendedProseMirrorSchema,
  useEditor,
} from "@/providers/editor-context-provider";
import "./prosemirror-styles.css";
import {
  baseKeymap,
  chainCommands,
  deleteSelection,
  joinBackward,
  joinTextblockBackward,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import {
  splitListItem,
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import { undo, redo, history } from "prosemirror-history";
import { trailingNode } from "prosemirror-trailing-node";
import { CodeBlock } from "@/custom-nodes/code-block";
import { InlineCodeNodeView } from "@/custom-nodes/inline-code";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { Textarea } from "@/components/ui/textarea";
import { CornerDownLeft } from "lucide-react";
import { DeletionSuggestion } from "@/custom-nodes/deletion-suggestion";
import { AdditionSuggestion } from "@/custom-nodes/addition-suggestion";
import { ensureTrailingParagraphPlugin } from "@/plugins/trailing-paragraph-plugin";
import { dragHandlePlugin } from "@/custom-nodes/drag-handle";
import type { Node } from "prosemirror-model";
import { AcceptAllRejectAllDialog } from "./accpet-all-reject-all-dialog";
import { EditsSuggestionsManager } from "@/services/suggestion-manager";
import { v4 as uuidv4 } from "uuid";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { useChatStore } from "@/store/chat";
import { useEditorStore } from "@/store/editor";
import { placeholderPlugin } from "@/custom-nodes/placeholder-plugin";
import { slashCommandTriggerKey, slashOpenCommandDialog } from "@/editor-input-rules/slash-command-dialog";

declare global {
  interface Window {
    suggestionsManager: EditsSuggestionsManager | null;
  }
}

function liftListItemOnlyAtStart(listItemType) {
  return function (state, dispatch, view) {
    const { $head, empty } = state.selection;

    if (!empty || $head.parentOffset !== 0) {
      return false;
    }

    return liftListItem(listItemType)(state, dispatch, view);
  };
}

const listRelatedKeymap = keymap({
  Enter: splitListItem(extendedProseMirrorSchema.nodes.list_item),

  Backspace: chainCommands(
    deleteSelection,
    liftListItemOnlyAtStart(extendedProseMirrorSchema.nodes.list_item),
    joinTextblockBackward
  ),
});

const plugins = [
  // dragHandlePlugin,
  ensureTrailingParagraphPlugin,
  slashOpenCommandDialog,
  placeholderPlugin,
  history(),
  listRelatedKeymap,
  keymap(baseKeymap),
  keymap({
    "Mod-z": undo,
    "Mod-y": redo,
    "Shift-Mod-z": redo,
  }),
];

export const ProseMirrorEditor = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { editorView, setEditorReady, isEditorReady, isAcceptRejectDialogOpen } = useEditor();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isStreaming, userInteractedRef } = useSSEStream();
  const {totalCurrentEdits} = useEditorStore()
  const isDialogClosingRef = useRef(false);
  const suggestionsManagerRef = useRef<EditsSuggestionsManager | null>(null)
  const [userSelectionFromEditor, setUserSelection] = useState<string>("")
  const [smartAiPopupPos, setSmartAiPopupPos] = useState<null | {
    x: Number;
    y: Number;
  }>(null);

  const scrollToBottom = () => {
    if (!editorRef.current || userInteractedRef.current) return;

    const container = editorRef.current;
    container.scrollTop = container.scrollHeight - container.clientHeight + 50;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema: extendedProseMirrorSchema,
      plugins: plugins,
    });

    if (!editorView.current && editorRef.current) {
      editorView.current = new EditorView(editorRef.current, {
        state,
        nodeViews: {
          deletion_suggestion: (node, view, getPos) => {
            return new DeletionSuggestion(node, view, getPos)
          },
          addition_suggestion: (node, view, getPos) => {
            return new AdditionSuggestion(node, view, getPos)
          },
          code_block: (node, view, getPos) => {
            return new CodeBlock(node, view, getPos);
          },
        },
        dispatchTransaction(tr) {
          const originalState = editorView.current.state;
          const newState = originalState.apply(tr);
          editorView.current.updateState(newState);
          const editorDocNodes = editorView.current.state.doc.content
          console.log("editor nodes are: ", editorDocNodes)
          console.log("EDITOR STATE IS: ", editorView.current.state.doc);
          console.log(
            "JSON EDITOR SCHEMA: ",
            editorView.current.state.doc.toJSON()
          );
          console.log("STATEEEEE IS: ", originalState)

          const isStreamingChange = tr.getMeta("isStreaming");
          const slashCommandMeta = tr.getMeta(slashCommandTriggerKey)

          console.log("sladhc ommands meta is: ", slashCommandMeta)

          if(slashCommandMeta && slashCommandMeta.isSlashCommandDialogOpen){
            const { endPos } = slashCommandMeta
            console.log("end pos is: ", endPos)
            const coordsAtPos = editorView.current.coordsAtPos(endPos)
            console.log("coords slash areL ", coordsAtPos)
            setSmartAiPopupPos({
              x: coordsAtPos.left,
              y: coordsAtPos.top
            })
          } else {
            setSmartAiPopupPos(null)
          }


          if (
            tr.docChanged &&
            isStreamingChange &&
            !userInteractedRef.current
          ) {
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }
        },
      });

      setEditorReady(true);
    }

    return () => {
      if (editorView.current) {
        editorView.current.destroy();
        editorView.current = null;
        setEditorReady(false);
      }
    };
  }, [editorView, setEditorReady]);

  const handleDialogClose = () => {
    isDialogClosingRef.current = true;
    setSmartAiPopupPos(null);
    editorView.current.focus()
    setTimeout(() => {
      isDialogClosingRef.current = false;
    }, 100);
  };



  useEffect(() => {
    const editorElement = editorRef.current;
    if (!editorElement || !editorView) return;

    const handleSelectionCheck = (event) => {
      if (isDialogClosingRef.current) return;

      setTimeout(() => {
        if (!editorView.current) return;
        const { state } = editorView.current;
        const { selection } = state;
        const { $from, $to } = selection.ranges[0]
        const fromPos = $from.pos
        const toPos = $to.pos

        if((toPos - fromPos) > 0){
          const coordsAtPos = editorView.current.coordsAtPos(toPos)
          const textContent = editorView.current.state.doc.textBetween(fromPos, toPos)
          console.log("TETX content is: ", textContent)
          setSmartAiPopupPos({x: coordsAtPos.left, y: coordsAtPos.top})
          setUserSelection(textContent)
        }
      }, 10);
    };

    editorElement.addEventListener("mouseup", handleSelectionCheck);

    return () => {
      editorElement.removeEventListener("mouseup", handleSelectionCheck);
    };
  }, [editorRef, editorView]);

  useEffect(() => {
    if (editorView.current && isEditorReady) {
      setTimeout(() => {
        suggestionsManagerRef.current = new EditsSuggestionsManager(editorView.current)

        window.suggestionsManager = suggestionsManagerRef.current;
        const view = editorView.current;
        view.focus();
        const state = view.state;
        const tr = state.tr; // Start one transaction
      
        // const text = state.schema.text("Start typing here...");
        // const pNode = state.schema.nodes.paragraph.create(null, text);
        // tr.insert(0, pNode);
      
        // Set selection using tr.doc (doc state *after* insert within this transaction)
        const selectionPos = 1;
        const selection = Selection.atEnd(tr.doc);
        tr.setSelection(selection);
      
        tr.scrollIntoView();
        view.dispatch(tr); // Dispatch single transaction
      }, 10);
    }
  }, [isEditorReady]);

  useEffect(() => {
    console.log("Changed dialog status: ", isAcceptRejectDialogOpen)
  },[isAcceptRejectDialogOpen])

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full relative">
      <div
        className="prosemirror-editor w-full max-h-[calc(100vh - 60px)] h-full overflow-scroll bg-red-400 py-4 px-4 border-t border-neutral-400 outline-none"
        ref={editorRef}
      />
      {smartAiPopupPos !== null && (
        <FloatingCommandDialog
          clientX={smartAiPopupPos.x}
          clientY={smartAiPopupPos.y}
          onClose={() => handleDialogClose()}
          selectedText={userSelectionFromEditor}
        />
      )}

      {totalCurrentEdits > 0 && <AcceptAllRejectAllDialog />}

    </div>
  );
};

const FloatingCommandDialog = ({ 
  clientX, 
  clientY, 
  onClose, 
  selectedText 
}) => {
  const [input, setInput] = useState("");
  const dialogRef = useRef(null);
  const textareaRef = useRef(null);
  const setChatMode = useChatStore(state => state.setCurrentChatMode)
  // Use our custom hook
  const { handleSelectionQuery, isStreaming } = useChatHandler();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      // event.stopPropagation();
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !isStreaming) {
      setChatMode("COMPOSER")
      // Use the handleSelectionQuery function from our custom hook
      handleSelectionQuery(selectedText, input.trim());
      setInput("");
      onClose();
    }
  };

  return (
    <div
      ref={dialogRef}
      className="absolute z-50 bg-white rounded-md shadow-lg border border-neutral-200"
      style={{
        left: `${clientX}px`,
        top: `${clientY}px`,
        width: "300px",
      }}
    >
      <div className="p-2">
        <div className="relative flex items-start">
          <Textarea
            ref={textareaRef}
            placeholder="Improve this section, rewrite this, etc."
            className="flex-1 text-sm rounded-md resize-none overflow-hidden border border-neutral-200
              text-neutral-800 placeholder:text-neutral-400
              pr-8 py-2 min-h-[38px] max-h-[150px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={2}
          />
          <div
            className={`absolute right-2 top-2 flex items-center justify-center w-6 h-6 
              ${
                !input.trim() || isStreaming
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:text-blue-500"
              }`}
            onClick={input.trim() && !isStreaming ? handleSubmit : undefined}
            aria-label="Send command"
          >
            <CornerDownLeft className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

