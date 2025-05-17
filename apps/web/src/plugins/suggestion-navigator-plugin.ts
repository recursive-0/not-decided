
import { Plugin, PluginKey } from "prosemirror-state";
import { suggestionHighlightPluginKey, SuggestionHighlightPluginState } from "./suggestion-highlight-plugin";
import { Decoration, DecorationSet } from "prosemirror-view";

interface SuggestionNavigatorPluginStateType {
  currentIndex: number | null;
}

interface SuggestionNavigatorPluginMetaDataType {
  navigateToIndex: number | null;
  action?: "reset"
}

export const suggestionNavigatorPluginKey = new PluginKey(
  "suggestion-navigator-plugin-key"
);

export const suggestionNavigatorPlugin = new Plugin({
  key: suggestionNavigatorPluginKey,
  state: {
    init(): SuggestionNavigatorPluginStateType {
      return { currentIndex: null };
    },
    apply(
      tr,
      value: SuggestionNavigatorPluginStateType
    ): SuggestionNavigatorPluginStateType {
      const metaData: SuggestionNavigatorPluginMetaDataType = tr.getMeta(
        suggestionNavigatorPluginKey
      );

      if(metaData && metaData.action){
        return {
            currentIndex: null
        }
      }
      
      // Only update if we have valid navigation metadata
      if (metaData && metaData.navigateToIndex !== undefined && metaData.navigateToIndex !== null) {
        return {
          currentIndex: metaData.navigateToIndex,
        };
      }
      
      return value;
    },
  },
  props: {
    decorations(state) {
      const pluginData: SuggestionNavigatorPluginStateType = suggestionNavigatorPluginKey.getState(state);

      if (pluginData.currentIndex === null) return DecorationSet.empty;

      const highlightMetaData: SuggestionHighlightPluginState | undefined = suggestionHighlightPluginKey.getState(state);
      if (!highlightMetaData || !highlightMetaData.suggestionMetaData) return DecorationSet.empty;

      const nodeId = highlightMetaData.suggestionMetaData[pluginData.currentIndex]?.nodeId;
      if (!nodeId) return DecorationSet.empty;

      // Find the node with the matching ID in the document
      const decorations: Decoration[] = [];
      state.doc.descendants((node, pos) => {
        if (node.attrs.nodeId === nodeId) {
          // Create a node decoration that wraps the entire node
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: "highlighted-suggestion-node",
            })
          );
          
          // Optionally, scroll the node into view
          // This would require a separate mechanism as decorations don't handle scrolling
          // You'll need to create a NodeView or use a separate effect to handle scrolling
          
          // Return false to stop traversal once we've found our node
          return false;
        }
        return true;
      });

      return DecorationSet.create(state.doc, decorations);
    },
  },
});