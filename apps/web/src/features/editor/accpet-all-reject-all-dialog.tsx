import { Button } from "@/components/ui/button";
import { MetaDataType, suggestionHighlightPluginKey, SuggestionHighlightPluginState } from "@/plugins/suggestion-highlight-plugin";
import { useEditor } from "@/providers/editor-context-provider";
import { Node } from "prosemirror-model";


interface AcceptAllRejectAllDialogProps {
  position: { left: number; bottom: number };
}

export const AcceptAllRejectAllDialog = ({
  position,
}: AcceptAllRejectAllDialogProps) => {

  const { editorView } = useEditor()

  const onAcceptAll = () => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const tr = state.tr; // Start a new transaction

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
    if (tr.docChanged) {
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

  return (
    <div
      className="flex justify-center p-2 z-10 pointer-events-none"
      style={{
        position: "fixed",
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="w-fit flex pointer-events-auto">
        <Button
          onClick={onAcceptAll}
          variant="default"
          className="bg-forest-teal z-20 hover:bg-forest-teal/20 text-white rounded-[0px] rounded-l-lg hover:cursor-pointer"
        >
          Accept All
        </Button>
        <Button
          onClick={onRejectAll}
          variant="destructive"
          className="bg-olive-green z-20 hover:bg-olive-green/20 text-white rounded-[0px] rounded-r-lg  hover:cursor-pointer"
        >
          Reject All
        </Button>
      </div>
      <div className="absolute h-full w-full top-0 left-0 bg-olive-green/90 blur-2xl z-0" />{" "}
    </div>
  );
};
