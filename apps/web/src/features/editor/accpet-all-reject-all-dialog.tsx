import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { handleSuggestionBatch, suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { suggestionNavigatorPluginKey } from "@/plugins/suggestion-navigator-plugin";
import { useEditor } from "@/providers/editor-context-provider";
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
    handleSuggestionBatch(editorView.current, "applyAllSuggestions")
  };

  const onRejectAll = () => {
    if (!editorView.current) return;
    handleSuggestionBatch(editorView.current, "rejectAllSuggestions")
  };


  const navigateToSuggestion = (view: EditorView, action: "next" | "previous") => {
    if (!view) return;
    
    const { state } = view;
    const tr = state.tr;
  
    // Get current suggestions and navigator state
    const navigatorState = suggestionNavigatorPluginKey.getState(state);
    const suggestionsState = suggestionHighlightPluginKey.getState(state);
    
    if (!suggestionsState || !suggestionsState.suggestionMetaData) {
      console.warn("No suggestion metadata available");
      return;
    }
    
    const suggestions = suggestionsState.suggestionMetaData;
    const totalSuggestions = suggestions.length;
  
    if (totalSuggestions === 0) {
      console.info("No suggestions to navigate");
      return;
    }
  
    // Calculate the target index based on current index and action
    let targetIndex = navigatorState?.currentIndex ?? null;
  
    if (action === "previous") {
      if (targetIndex === null || targetIndex <= 0) {
        // Wrap around to the end if at beginning or uninitialized
        targetIndex = totalSuggestions - 1;
      } else {
        targetIndex--;
      }
    } else { // "next"
      if (targetIndex === null || targetIndex >= totalSuggestions - 1) {
        // Wrap around to the beginning if at end or uninitialized
        targetIndex = 0;
      } else {
        targetIndex++;
      }
    }
  
    // Set the new target index in the navigator plugin
    tr.setMeta(suggestionNavigatorPluginKey, { 
      navigateToIndex: targetIndex 
    });
  
    // Find the node for the target suggestion
    const targetSuggestion = suggestions[targetIndex];
    if (targetSuggestion && targetSuggestion.nodeId) {
      // Find the position of the node in the document
      let nodePos: number | null = null;
      let nodeSize: number = 0;
      
      state.doc.descendants((node, pos) => {
        if (node.attrs.nodeId === targetSuggestion.nodeId) {
          nodePos = pos;
          nodeSize = node.nodeSize;
          return false; // Stop traversal once found
        }
        return true;
      });
  
      if (nodePos !== null) {
        // Set selection to the start of the node
        const from = nodePos;
        const to = nodePos + nodeSize;
        
        // Create a text selection that spans the node
        // tr.setSelection(TextSelection.create(state.doc, from, to));
        
        // Scroll the node into view
        tr.scrollIntoView();
      } else {
        console.warn(`Node with ID ${targetSuggestion.nodeId} not found in document`);
      }
    }
  
    // Only dispatch if we've made changes
    if (tr.docChanged || tr.steps.length > 0 || tr.selectionSet || tr.scrolledIntoView) {
      view.dispatch(tr);
    }
    
    // Focus the editor for keyboard navigation
    view.focus();
    
    // Add a small delay then trigger the scrollIntoView helper to ensure visibility
    setTimeout(() => {
      const highlightedNode = document.querySelector('.highlighted-suggestion-node');
      if (highlightedNode) {
        highlightedNode.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 50);
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
          onClick={() => navigateToSuggestion(editorView.current!, "previous")}
          variant="ghost"
          className={`${baseClasses}`}
        >
          Previous
        </Button>
        <Button
          onClick={() => navigateToSuggestion(editorView.current!, "next")}
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
