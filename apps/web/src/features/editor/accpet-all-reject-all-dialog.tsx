import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { handleSuggestionBatch, suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { suggestionNavigatorPluginKey } from "@/plugins/suggestion-navigator-plugin";
import { useEditor } from "@/providers/editor-context-provider";
import { EditorView } from "prosemirror-view";
import "./accept-rejet-dialog.css";


interface AcceptAllRejectAllDialogProps {
  position: { left: number; bottom: number };
}

const baseClasses = "z-20 h-fit p-1.5 px-2 text-white bg-none rounded-md hover:cursor-pointer hover:bg-layer-8 hover:text-layer-15"

const isElementInViewport = (element: Element, threshold: number = 0.7): boolean => {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Calculate visible height of the element
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  
  // Calculate the ratio of visible area
  const elementHeight = rect.height;
  if (elementHeight === 0) return false;
  
  const visibilityRatio = visibleHeight / elementHeight;
  return visibilityRatio >= threshold;
};

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

    // Dispatch the change to apply the decoration
    view.dispatch(tr);
    view.focus();

    // After the decoration is applied, check visibility and scroll if needed
    setTimeout(() => {
      const highlightedNode = document.querySelector('.highlighted-suggestion-node');
      
      if (highlightedNode) {
        // Only scroll if the element is not sufficiently visible (less than 70% visible)
        if (!isElementInViewport(highlightedNode, 0.7)) {
          highlightedNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }, 50);
  };


  return (
    <div
      className="relative flex justify-center px-0.5 py-0.5 bg-layer-6 rounded-lg items-center gap-2 z-10 pointer-events-none border border-layer-8"
      style={{
        position: "fixed",
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        transform: "translateX(-50%)",
      // Optional: Add a subtle backdrop blur
      backdropFilter: 'blur(2px)',
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
