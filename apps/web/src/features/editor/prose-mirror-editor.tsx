import { CodeBlock } from "@/custom-nodes/code-block";
import { persistentHighlightPlugin } from "@/custom-nodes/persistent-highlight-plugin";
import { placeholderPlugin } from "@/custom-nodes/placeholder-plugin";
import { ensureNodeIdPlugin } from "@/plugins/ensure-nodeid-plugin";
import { suggestionHighlightPlugin } from "@/plugins/suggestion-highlight-plugin";
import { suggestionNavigatorPlugin } from "@/plugins/suggestion-navigator-plugin";
import {
  extendedProseMirrorSchema,
  useEditor,
} from "@/providers/editor-context-provider";
import { useWrisorStore } from "@/store/wrisor";
import "@/styles/suggestion-navigation.css";
import {
  baseKeymap,
  chainCommands,
  deleteSelection,
  joinTextblockBackward,
} from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  slashCommandTriggerKey,
  slashOpenCommandDialog,
} from "../../editor-input-rules/slash-command-dialog";
import "../../styles/suggestion-highlight-plugin.css";
import { AcceptAllRejectAllDialog } from "./accpet-all-reject-all-dialog";
import { CommandPalette } from "./command-palette";
import "./external-dialogs.css";
import "./prosemirror-styles.css";
import "../../plugins/text-highlight-plugin/text-highlight-plugin.css"
import { textHighlightPlugin } from "@/plugins/text-highlight-plugin/text-highlight-plugin";
// import { ensureTrailingParagraphPlugin } from "@/plugins/trailing-paragraph-plugin";

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
  // ensureTrailingParagraphPlugin,
  textHighlightPlugin,
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
  const { totalCurrentEdits } = useWrisorStore();
  const isDialogClosingRef = useRef(false);
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
            const { $from, $to, head } = selection;
            const fromPos = $from.pos;
            const toPos = $to.pos;

            if (toPos - fromPos > 0) {
              // The 'head' is where the user's cursor ended up
              // If head === anchor, no selection (just cursor)
              // If head > anchor, user selected forward
              // If head < anchor, user selected backward

              const actualEndPos = head; // Always use head as the end position

              const coordsAtPos = editorView.current.coordsAtPos(actualEndPos);

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
      }, 10);
    }
  }, [isEditorReady, editorView]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full relative max-h-[calc(100vh - 60px)] overflow-scroll"
    >
      <div
        className="prosemirror-editor w-full h-full py-4 px-4 outline-none relative"
        ref={editorRef}
      />
      {smartAiPopupPos !== null && (
        <CommandPalette
          clientX={smartAiPopupPos.x}
          clientY={smartAiPopupPos.y}
          onClose={() => handleDialogClose()}
        />
      )}

      {totalCurrentEdits > 1 && dialogPosition && (
        <AcceptAllRejectAllDialog position={dialogPosition} />
      )}
    </div>
  );
};


