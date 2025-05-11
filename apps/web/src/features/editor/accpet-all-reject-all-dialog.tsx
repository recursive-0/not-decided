import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MetaDataType, suggestionHighlightPluginKey, SuggestionHighlightPluginState } from "@/plugins/suggestion-highlight-plugin";
import { suggestionNavigatorPluginKey } from "@/plugins/suggestion-navigator-plugin";
import { useEditor } from "@/providers/editor-context-provider";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";


interface AcceptAllRejectAllDialogProps {
  position: { left: number; bottom: number };
}

const baseClasses = "z-20 h-fit p-1.5 px-2 text-black bg-none rounded-md hover:cursor-pointer hover:bg-palette-gold-dark"

export const AcceptAllRejectAllDialog = ({
  position,
}: AcceptAllRejectAllDialogProps) => {

  const { editorView } = useEditor()

  const onAcceptAll = () => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const tr = state.tr; 

    const pluginState: SuggestionHighlightPluginState | undefined =
      suggestionHighlightPluginKey.getState(state);

    if (pluginState && pluginState.metaData && pluginState.metaData.length > 0) {
      const currentSuggestions: MetaDataType[] = pluginState.metaData;
      const doc = state.doc;
      const rangesToDelete: { from: number; to: number; nodeId?: string | null }[] = [];

      console.log('[Dialog:onAcceptAll] Initial currentSuggestions:', JSON.parse(JSON.stringify(currentSuggestions)));

      currentSuggestions.forEach((suggestionNode) => {
        if (suggestionNode.type === "deletion") {
          const nodeId = suggestionNode.nodeId;
          let nodeFoundAndRangeAdded = false;
          doc.descendants((node: Node, pos: number) => {
            if (nodeFoundAndRangeAdded) return false;

            if (node.attrs.nodeId === nodeId) {
              console.log(`[Dialog:onAcceptAll] Matched nodeId "${nodeId}" (type "deletion") for deletion at pos ${pos}.`);
              rangesToDelete.push({ from: pos, to: pos + node.nodeSize, nodeId: nodeId });
              nodeFoundAndRangeAdded = true;
              return false;
            }
            return true;
          });
          if (!nodeFoundAndRangeAdded) {
            console.warn(`[Dialog:onAcceptAll] NodeId "${nodeId}" (type "deletion") NOT FOUND in document.`);
          }
        }
      });

      console.log('[Dialog:onAcceptAll] Collected rangesToDelete:', JSON.parse(JSON.stringify(rangesToDelete)));

      if (rangesToDelete.length > 0) {
        // Sort ranges in reverse order to delete from the end, avoiding position shifts
        rangesToDelete.sort((a, b) => b.from - a.from);
        rangesToDelete.forEach(range => {
          console.log(`[Dialog:onAcceptAll] Applying tr.deleteRange from ${range.from} to ${range.to} for nodeId "${range.nodeId}"`);
          try {
            tr.deleteRange(range.from, range.to);
          } catch (e) {
            console.error(`[Dialog:onAcceptAll] Error during tr.deleteRange for nodeId "${range.nodeId}":`, e);
          }
        });
      }
    }

    // tell the plugin to clear its state
    tr.setMeta(suggestionHighlightPluginKey, {
      action: {
        type: "clearAllSuggestionHighlights", 
        nodeId: null, 
      },
    });

    // Only dispatch if the transaction actually does something
    if (tr.docChanged || pluginState.metaData) {
      console.log(`[Dialog:onAcceptAll] Dispatching transaction. docChanged: ${tr.docChanged}, steps: ${tr.steps.length}`);
      editorView.current.dispatch(tr);
    } else {
      console.log("[Dialog:onAcceptAll] No document changes or meta to dispatch.");
    }
    editorView.current.focus();
  };

  const onRejectAll = () => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const tr = state.tr;

    const pluginState: SuggestionHighlightPluginState | undefined =
      suggestionHighlightPluginKey.getState(state);

    if (pluginState && pluginState.metaData && pluginState.metaData.length > 0) {
      const currentSuggestions: MetaDataType[] = pluginState.metaData;
      const doc = state.doc;
      const rangesToDelete: { from: number; to: number; nodeId?: string | null }[] = [];

      console.log('[Dialog:onRejectAll] Initial currentSuggestions:', JSON.parse(JSON.stringify(currentSuggestions)));

      currentSuggestions.forEach((suggestionNode) => {
        // For "Reject All", we delete nodes marked as "addition" type suggestions
        if (suggestionNode.type === "addition") {
          const nodeId = suggestionNode.nodeId;
          let nodeFoundAndRangeAdded = false;
          doc.descendants((node: Node, pos: number) => {
            if (nodeFoundAndRangeAdded) return false;
            if (node.attrs.nodeId === nodeId) {
              console.log(`[Dialog:onRejectAll] Matched nodeId "${nodeId}" (type "addition") for deletion at pos ${pos}.`);
              rangesToDelete.push({ from: pos, to: pos + node.nodeSize, nodeId: nodeId });
              nodeFoundAndRangeAdded = true;
              return false;
            }
            return true;
          });
          if (!nodeFoundAndRangeAdded) {
            console.warn(`[Dialog:onRejectAll] NodeId "${nodeId}" (type "addition") NOT FOUND in document.`);
          }
        }
      });
      
      console.log('[Dialog:onRejectAll] Collected rangesToDelete:', JSON.parse(JSON.stringify(rangesToDelete)));

      if (rangesToDelete.length > 0) {
        rangesToDelete.sort((a, b) => b.from - a.from);
        rangesToDelete.forEach(range => {
          console.log(`[Dialog:onRejectAll] Applying tr.deleteRange from ${range.from} to ${range.to} for nodeId "${range.nodeId}"`);
           try {
            tr.deleteRange(range.from, range.to);
          } catch (e) {
            console.error(`[Dialog:onRejectAll] Error during tr.deleteRange for nodeId "${range.nodeId}":`, e);
          }
        });
      }
    }

    tr.setMeta(suggestionHighlightPluginKey, {
      action: {
        type: "clearAllSuggestionHighlights",
        nodeId: null,
      },
    });

    if (tr.docChanged) {
      console.log(`[Dialog:onRejectAll] Dispatching transaction. docChanged: ${tr.docChanged}, steps: ${tr.steps.length}`);
      editorView.current.dispatch(tr);
    } else {
      console.log("[Dialog:onRejectAll] No changes to dispatch.");
    }
    editorView.current.focus();
  };


const navigateToSuggestion = (view: EditorView, action: "next" | "previous") => {
  console.log("Inside navigate sugegstion")
  const { state } = view;
  const tr = state.tr;

  // 1. Get current suggestions and navigator state to calculate the *target* index
  const currentNavigatorState = suggestionNavigatorPluginKey.getState(state);
  const suggestionsData = suggestionHighlightPluginKey.getState(state);
  const suggestions = suggestionsData?.metaData || [];
  const totalSuggestions = suggestions.length;

  if (totalSuggestions === 0) return; // No suggestions

  let targetIndex = currentNavigatorState?.currentIndex ?? null;

  if (action === "previous") {
      if (targetIndex === null) targetIndex = totalSuggestions - 1;
      else if (targetIndex === 0) targetIndex = totalSuggestions - 1; // Or stay at 0
      else targetIndex--;
  } else { // "next"
      if (targetIndex === null) targetIndex = 0;
      else if (targetIndex >= totalSuggestions - 1) targetIndex = 0; // Or stay at last
      else targetIndex++;
  }
  
  // Ensure targetIndex is valid (can be omitted if wrapping is guaranteed)
  if (targetIndex < 0 || targetIndex >= totalSuggestions) {
      console.warn("Calculated targetIndex is out of bounds:", targetIndex);
      return; // Or clamp/reset appropriately
  }

  // 2. Set metadata for the navigator plugin to update its currentIndex
  // It's better to tell the plugin WHICH index to go to, rather than just "next"/"previous"
  // if the calculation is done here. Or, keep "next"/"previous" and let plugin calculate.
  // For simplicity with your current plugin structure:
  tr.setMeta(suggestionNavigatorPluginKey, { action });
  // OR, if you change plugin meta to accept an index:
  // tr.setMeta(suggestionNavigatorPluginKey, { action: "goto", index: targetIndex });
  // Then the plugin's `apply` would be simpler: just set `currentIndex = meta.index`.

  // 3. Find the node for the targetIndex and set selection/scroll
  const suggestionToFocus = suggestions[targetIndex];
  if (suggestionToFocus && suggestionToFocus.nodeId) {
      let nodePosTo: number | null = null;
      state.doc.descendants((node, pos) => {
          if (node.attrs.nodeId === suggestionToFocus.nodeId) {
              nodePosTo = pos + node.nodeSize;
              return false; // Stop searching
          }
          return true;
      });

      if (nodePosTo !== null) {
          tr.setSelection(TextSelection.create(state.doc, nodePosTo));
          tr.scrollIntoView();
      } else {
          console.warn(`Node with ID ${suggestionToFocus.nodeId} for index ${targetIndex} not found.`);
      }
  }

  if (tr.docChanged || tr.steps.length > 0 || tr.selectionSet || tr.scrolledIntoView) {
    view.dispatch(tr);
  }
  view.focus();
};

// --- In your button's onClick ---
// onClick={() => navigateToSuggestion(editorView.current, "next")}

  return (
    <div
      className="flex justify-center px-0.5 py-0.5 bg-background rounded-lg items-center gap-2 z-10 pointer-events-none shadow-[0px_0_400px_10px_rgba(0,0,0,0.25)] shadow-olive-green border-[1px] border-palette-gold-light"
      style={{
        position: "fixed",
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="w-fit flex justify-center items-center gap-1 pointer-events-auto">
        <Button
          onClick={onAcceptAll}
          variant="ghost"
          className={`${baseClasses}`}
        >
          Accept All
        </Button>
        <Separator orientation="vertical" className="w-1 h-full" />
        <Button
          onClick={onRejectAll}
          variant="ghost"
          className={`${baseClasses}`}
        >
          Reject All
        </Button>
      </div>
      <div className="w-fit flex justify-center items-center gap-1 pointer-events-auto">
      <Button
          onClick={() => navigateToSuggestion(editorView.current, "previous")}
          variant="ghost"
          className={`${baseClasses}`}
        >
          Previous
        </Button>
        <Button
          onClick={() => navigateToSuggestion(editorView.current, "next")}
          variant="ghost"
          className={`${baseClasses}`}
        >
          Next
        </Button>
      </div>
      <div className="absolute h-full w-full top-0 left-0 -z-20" />{" "}
    </div>
  );
};
