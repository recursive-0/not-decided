"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState, TextSelection } from "prosemirror-state";
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
  ensureTrailingParagraphPlugin,
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
  const { editorView, setEditorReady, isEditorReady } = useEditor();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isStreaming, userInteractedRef } = useSSEStream();
  const isDialogClosingRef = useRef(false);
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
          scrollThreshold: 0,
          scrollMargin: 0,
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
          console.log("EDITOR STATE IS: ", editorView.current.state.doc);
          console.log(
            "JSON EDITOR SCHEMA: ",
            editorView.current.state.doc.toJSON()
          );

          const isStreamingChange = tr.getMeta("isStreaming");

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

        if (selection instanceof TextSelection && !selection.empty) {
          setSmartAiPopupPos({ x: event.clientX, y: event.clientY });
        }
      }, 0);
    };

    editorElement.addEventListener("mouseup", handleSelectionCheck);

    return () => {
      editorElement.removeEventListener("mouseup", handleSelectionCheck);
    };
  }, [editorRef, editorView]);

  useEffect(() => {
    if (editorView.current && isEditorReady) {
      setTimeout(() => {
        editorView.current.focus();
        const textNode = editorView.current.state.schema.text("hello")
        // const placeholderPara = editorView.current.state.schema.nodes.paragraph.create()
        // const tr = editorView.current.state.tr.insert(0, placeholderPara)
        // editorView.current.dispatch(tr)
        // const bulletList = editorView.current.state.schema.nodes.blockquote.create()
        // const tr = editorView.current.state.tr.insert(0, bulletList)
        // // const lN = editorView.current.state.schema.nodes.list_item.create();
        // // tr.insert()
        // editorView.current.dispatch(tr)
      }, 1000);
    }
  }, [isEditorReady]);

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full">
      <div
        className="prosemirror-editor w-full max-h-[calc(100vh - 60px)] h-full overflow-scroll bg-red-400 py-4 px-4 border-t border-neutral-400 outline-none"
        ref={editorRef}
      />
      {}
      {smartAiPopupPos !== null && (
        <FloatingCommandDialog
          clientX={smartAiPopupPos.x}
          clientY={smartAiPopupPos.y}
          onClose={() => handleDialogClose()}
          onSubmit={(text) => console.log(text)}
        />
      )}
    </div>
  );
};

const FloatingCommandDialog = ({ clientX, clientY, onClose, onSubmit }) => {
  const [input, setInput] = useState("");
  const dialogRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      event.stopPropagation();
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
      if (input.trim()) {
        onSubmit(input);
        setInput("");
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput("");
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
            rows={2}
          />
          <div
            className={`absolute right-2 top-2 flex items-center justify-center w-6 h-6 
              ${
                !input.trim()
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:text-blue-500"
              }`}
            onClick={input.trim() ? handleSendMessage : undefined}
            aria-label="Send command"
          >
            <CornerDownLeft className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
