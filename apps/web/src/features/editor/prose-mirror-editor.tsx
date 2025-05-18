import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState, Selection } from "prosemirror-state";
import {
  extendedProseMirrorSchema,
  useEditor,
} from "@/providers/editor-context-provider";
import "./prosemirror-styles.css";
import "./external-dialogs.css";
import "@/styles/suggestion-navigation.css"
import "../../styles/suggestion-highlight-plugin.css";
import {
  baseKeymap,
  chainCommands,
  deleteSelection,
  joinTextblockBackward,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { splitListItem, liftListItem } from "prosemirror-schema-list";
import { undo, redo, history } from "prosemirror-history";
import { CodeBlock } from "@/custom-nodes/code-block";
import { Textarea } from "@/components/ui/textarea";
import { CornerDownLeft, X } from "lucide-react";
import { AcceptAllRejectAllDialog } from "./accpet-all-reject-all-dialog";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { useChatStore } from "@/store/chat";
import { useEditorStore } from "@/store/editor";
import { placeholderPlugin } from "@/custom-nodes/placeholder-plugin";
import {
  slashCommandTriggerKey,
  slashOpenCommandDialog,
} from "../../editor-input-rules/slash-command-dialog";
import { toast } from "@/components/ui/custom-toasts";
import { persistentHighlightPlugin } from "@/custom-nodes/persistent-highlight-plugin";
import { ensureNodeIdPlugin } from "@/plugins/ensure-nodeid-plugin";
import { suggestionHighlightPlugin } from "@/plugins/suggestion-highlight-plugin";
import { ensureTrailingParagraphPlugin } from "@/plugins/trailing-paragraph-plugin";
import { suggestionNavigatorPlugin } from "@/plugins/suggestion-navigator-plugin";
import { Button } from "@/components/ui/button";


const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};


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
  // autoCompletePlugin,
  persistentHighlightPlugin,
  slashOpenCommandDialog,
  suggestionHighlightPlugin,
  // massAcceptRejectPlugin,
  suggestionNavigatorPlugin,
  ensureTrailingParagraphPlugin,
  ensureNodeIdPlugin,
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

const normalizeCommandDialogPos = (selectionCoords, containerBounds) => {
  const { left: selectionX, top: selectionY } = selectionCoords;

  const {
    left: containerLeft,
    right: containerRight,
    top: containerTop,
    bottom: containerBottom,
  } = containerBounds;

  const popupWidth = 300;
  const popupHeight = 150;

  let left = selectionX;
  let top = selectionY;

  if (left + popupWidth > containerRight) {
    left = containerRight - popupWidth - 10;
  }

  if (left < containerLeft) {
    left = containerLeft + 10;
  }

  if (top + popupHeight > containerBottom) {
    top = selectionY - popupHeight - 5;

    if (top < containerTop) {
      top = containerTop + 10;
    }
  }

  return { left, top };
};

export const ProseMirrorEditor = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { editorContainerRef, editorView, setEditorReady, isEditorReady } =
    useEditor();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { totalCurrentEdits } = useEditorStore();
  const isDialogClosingRef = useRef(false);
  const [userSelectionFromEditor, setUserSelection] = useState<string>("");
  const [dialogPosition, setDialogPosition] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [smartAiPopupPos, setSmartAiPopupPos] = useState<null | {
    x: number;
    y: number;
  }>(null);

  const calculateDialogPosition = useCallback(() => {
    if (!editorRef.current) {
      setDialogPosition(null);
      return;
    }

    const editorRect = editorRef.current.getBoundingClientRect();

    const editorCenterLeft = editorRect.left + editorRect.width / 2;

    const desiredBottom = 40;

    setDialogPosition({
      left: editorCenterLeft,
      bottom: desiredBottom,
    });
  }, [editorRef]);

  const debouncedCalculatePosition = useRef(
    debounce(calculateDialogPosition, 10)
  ).current;


  const handleDialogClose = () => {
    isDialogClosingRef.current = true;
    setSmartAiPopupPos(null);
    editorView.current!.focus();
    setTimeout(() => {
      isDialogClosingRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (!editorRef.current) return;
    editorContainerRef.current = editorRef.current;

    const state = EditorState.create({
      schema: extendedProseMirrorSchema,
      plugins: plugins,
    });

    if (!editorView.current && editorRef.current) {
      editorView.current = new EditorView(editorRef.current, {
        state,

        nodeViews: {
          code_block: (node, view, getPos) => {
            return new CodeBlock(node, view, getPos);
          },
        },
        dispatchTransaction(tr) {
          if (!editorView.current) return;
          const originalState = editorView.current.state;
          const newState = originalState.apply(tr);
          editorView.current.updateState(newState);

          const slashCommandMeta = tr.getMeta(slashCommandTriggerKey);

          if (slashCommandMeta && slashCommandMeta.isSlashCommandDialogOpen) {
            const { endPos } = slashCommandMeta;

            const coordsAtPos = editorView.current.coordsAtPos(endPos);

            const editorContainerPos =
              containerRef.current!.getBoundingClientRect();

            const { left, top } = normalizeCommandDialogPos(
              coordsAtPos,
              editorContainerPos
            );

            setSmartAiPopupPos({
              x: left,
              y: top,
            });
          }
        },
      });

      setEditorReady(true);
      calculateDialogPosition();

      window.addEventListener("resize", calculateDialogPosition);
    }

    if (editorRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === editorRef.current) {
            debouncedCalculatePosition();
            break;
          }
        }
      });

      observer.observe(editorRef.current);
      requestAnimationFrame(() => {
        calculateDialogPosition();
      });

      return () => {
        if (editorView.current) {
          editorView.current.destroy();
          editorView.current = null;
          setEditorReady(false);
        }

        observer.disconnect();
        window.removeEventListener("resize", calculateDialogPosition);
      };
    }
  }, [editorView, setEditorReady]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (!editorElement || !editorView) return;
  
    const handleSelectionCheck = () => {
      if (isDialogClosingRef.current) return;
      let isMouseDown = true;
  
      const handleMouseUp = () => {
        if (isMouseDown) {
          setTimeout(() => {
            if (!editorView.current) return;
            const { state } = editorView.current;
            const { selection } = state;
            const { $from, $to, head, anchor } = selection;
            const fromPos = $from.pos;
            const toPos = $to.pos;
            
            console.log("Selection from:", fromPos, "to:", toPos);
            console.log("Selection head:", head, "anchor:", anchor);
            
            if (toPos - fromPos > 0) {
              // The 'head' is where the user's cursor ended up
              // If head === anchor, no selection (just cursor)
              // If head > anchor, user selected forward
              // If head < anchor, user selected backward
              
              const actualEndPos = head; // Always use head as the end position
              
              console.log("Using head as end position:", actualEndPos);
              
              const coordsAtPos = editorView.current.coordsAtPos(actualEndPos);
              console.log("Coords at head:", coordsAtPos);
  
              const editorContainerPos = containerRef.current!.getBoundingClientRect();
  
              const { left, top } = normalizeCommandDialogPos(
                coordsAtPos,
                editorContainerPos
              );
  
              const textContent = editorView.current.state.doc.textBetween(
                fromPos,
                toPos
              );
              
              console.log("Text content:", textContent);
              console.log("Dialog position:", left, top);
              
              setSmartAiPopupPos({
                x: left,
                y: top,
              });
              setUserSelection(textContent);
            }
          }, 100);
          isMouseDown = false;
        }
  
        editorElement.removeEventListener("mouseup", handleMouseUp);
      };
  
      editorElement.addEventListener("mouseup", handleMouseUp);
    };
  
    editorElement.addEventListener("selectstart", handleSelectionCheck);
  
    return () => {
      editorElement.removeEventListener("selectstart", handleSelectionCheck);
    };
  }, [editorRef, editorView]);

  useEffect(() => {
    if (editorView.current && isEditorReady) {
      setTimeout(() => {
        if (!editorView.current) return;
        const view = editorView.current;
        view.focus();
        const state = view.state;
        const tr = state.tr;

        const selection = Selection.atEnd(tr.doc);
        tr.setSelection(selection);

        view.dispatch(tr);
      }, 10);
    }
  }, [isEditorReady, editorView]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full relative max-h-[calc(100vh - 60px)] overflow-scroll"
    >
      <div
        className="prosemirror-editor w-full h-full py-4 px-4 outline-none"
        ref={editorRef}
      />
      {smartAiPopupPos !== null && (
        <FloatingCommandDialog
          clientX={smartAiPopupPos.x}
          clientY={smartAiPopupPos.y}
          onClose={() => handleDialogClose()}
          selectedText={userSelectionFromEditor}
          setUserSelection={setUserSelection}
        />
      )}

      {totalCurrentEdits > 1 && dialogPosition && (
        <AcceptAllRejectAllDialog position={dialogPosition} />
      )}

      {}
    </div>
  );
};

const FloatingCommandDialog = ({
  clientX,
  clientY,
  onClose,
  selectedText,
  setUserSelection,
}) => {
  const [input, setInput] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null);
  const setChatMode = useChatStore((state) => state.setCurrentChatMode);

  const { handleSelectionQuery, isStreaming } = useChatHandler();
  const { totalCurrentEdits } = useEditorStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        event.target &&
        event.target instanceof Node &&
        !dialogRef.current.contains(event.target as Node)
      ) {
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
      if (totalCurrentEdits > 0) {
        toast({
          title: "You have pending changes!",
          description:
            "Please apply or discard your changes before generating a new response.",
          variant: "warning",
        });
        return;
      }
      if (input.trim() && !isStreaming) {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !isStreaming) {
      setChatMode("COMPOSER");

      handleSelectionQuery(selectedText, input.trim());
      setInput("");
      setUserSelection("");
      onClose();
    }
  };

  return (
    <div
      ref={dialogRef}
      className="fixed z-50 bg-palette-beige-1 rounded-md shadow-lg border border-neutral-200"
      style={{
        left: `${clientX}px`,
        top: `${clientY}px`,
        width: "300px",
      }}
    >
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
        <span className="text-black text-sm">Prompt</span>
        <Button onClick={onClose} variant="default" className="p-0 py-1 px-0 h-fit w-fit ">
          <X />
        </Button>
        </div>
        <div className="relative flex flex-col items-start">
          <Textarea
            autoFocus
            ref={textareaRef}
            placeholder="Improve this section, rewrite this, etc."
            className="flex-1 text-sm rounded-md resize-none overflow-scroll border border-neutral-200
              text-palette-dark placeholder:text-neutral-400
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
