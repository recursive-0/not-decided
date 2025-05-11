import { Plugin, PluginKey } from "prosemirror-state";
import { suggestionHighlightPluginKey } from "./suggestion-highlight-plugin";
import { Decoration, DecorationSet } from "prosemirror-view";


interface SuggestionNavigatorPluginStateType {
    currentIndex: number | null
}

interface SuggestionNavigatorPluginMetaDataType {
    action: "previous" | "next"
}

export const suggestionNavigatorPluginKey = new PluginKey("suggestion-navigator-plugin-key")

export const suggestionNavigatorPlugin = new Plugin({
    key: suggestionNavigatorPluginKey,
    state: {
        init(): SuggestionNavigatorPluginStateType {
            return { currentIndex: null }
        },
        apply(tr, value: SuggestionNavigatorPluginStateType, _, newState): SuggestionNavigatorPluginStateType {
            const meta: SuggestionNavigatorPluginMetaDataType | undefined = tr.getMeta(suggestionNavigatorPluginKey);
        
            const suggestionsData = suggestionHighlightPluginKey.getState(newState);
            const suggestions = suggestionsData?.metaData || [];
            const totalSuggestions = suggestions.length;
        
            // If no action, but suggestions list might have changed, validate/reset currentIndex
            if (!meta || !meta.action) {
                if (value.currentIndex !== null) {
                    if (totalSuggestions === 0) {
                        return { currentIndex: null }; // No suggestions left
                    }
                    if (value.currentIndex >= totalSuggestions) {
                        // Current index is out of bounds (e.g. suggestions were removed)
                        return { currentIndex: totalSuggestions - 1 }; // Go to new last item
                    }
                }
                return value; // No change needed
            }
        
            // If there are no suggestions, navigation actions reset currentIndex
            if (totalSuggestions === 0) {
                return { currentIndex: null };
            }
        
            let newIndex = value.currentIndex;
        
            if (meta.action === "previous") {
                if (newIndex === null) { // If nothing selected, "previous" goes to the last item
                    newIndex = totalSuggestions - 1;
                } else if (newIndex === 0) { // Already at the first item
                    // Option 1: Stay at the first item (do nothing to index)
                    // return value;
                    // Option 2: Wrap around to the last item
                    newIndex = totalSuggestions - 1; // Or implement no-wrap as per your UX preference
                } else {
                    newIndex--;
                }
            } else if (meta.action === "next") {
                if (newIndex === null) { // If nothing selected, "next" goes to the first item
                    newIndex = 0;
                } else if (newIndex >= totalSuggestions - 1) { // Already at the last item
                    // Option 1: Stay at the last item
                    // return value;
                    // Option 2: Wrap around to the first item
                    newIndex = 0; // Or implement no-wrap
                } else {
                    newIndex++;
                }
            }
        
            // Ensure newIndex is within valid bounds if not wrapping (can be removed if wrapping is desired)
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= totalSuggestions) newIndex = totalSuggestions - 1;
        
        
            if (newIndex === value.currentIndex && value.currentIndex !== null && meta?.action) {
                // If the index didn't change due to being at an edge and not wrapping,
                // but an action was explicitly dispatched, you might still want to "refresh" the view
                // or trigger side effects. However, just returning the same state is usually fine.
                // For now, we assume if index is same, state is same.
            }
            
            return { currentIndex: newIndex };
        }
    },
    props: {
        decorations(state) {
            const navigatorState: SuggestionNavigatorPluginStateType | undefined = suggestionNavigatorPluginKey.getState(state);
    
            // Explicitly check against null, as 0 is a valid index
            if (!navigatorState || navigatorState.currentIndex === null) {
                return DecorationSet.empty;
            }
    
            const currentIndex = navigatorState.currentIndex;
    
            const suggestionsData = suggestionHighlightPluginKey.getState(state);
            const suggestions = suggestionsData?.metaData || [];
    
            if (suggestions.length === 0 || currentIndex < 0 || currentIndex >= suggestions.length) {
                // Current index is invalid or no suggestions
                return DecorationSet.empty;
            }
    
            const currentSuggestionMeta = suggestions[currentIndex];
            // Ensure the suggestion metadata has a nodeId
            if (!currentSuggestionMeta || !currentSuggestionMeta.nodeId) {
                console.warn("[SuggestionNavigator] Current suggestion metadata is missing or has no nodeId.", currentSuggestionMeta);
                return DecorationSet.empty;
            }
    
            const nodeIdToHighlight = currentSuggestionMeta.nodeId;
            const doc = state.doc;
            const decorations: Decoration[] = [];
            let nodeFound = false;
    
            doc.descendants((node, pos) => {
                if (nodeFound) return false; // Already found and decorated, stop searching
    
                if (node.attrs.nodeId === nodeIdToHighlight) {
                    const from = pos;
                    const to = pos + node.nodeSize;
                    decorations.push(
                        Decoration.node(from, to, { class: 'suggestion-navigated-active' })   
                    );
                    const currentNodeDot = document.createElement('span')
                    currentNodeDot.classList.add("current-node-dot")
                    decorations.push(
                        Decoration.widget(to, currentNodeDot, { side: -1 }) // Add spec with side
                    )
                    nodeFound = true;
                    return false; // Stop searching this branch further
                }
                return true; // Continue searching if not a container node that we shouldn't enter
            });
    
            if (decorations.length > 0) {
                return DecorationSet.create(doc, decorations);
            }
            
            console.warn(`[SuggestionNavigator] Node with ID "${nodeIdToHighlight}" not found in the document.`);
            return DecorationSet.empty;
        },
    }
})