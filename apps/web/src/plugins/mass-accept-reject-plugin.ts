import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view"; // Import EditorView
import { suggestionHighlightPluginKey } from "./suggestion-highlight-plugin";
import { useEditorStore } from "@/store/editor"; // Your Zustand store

export const massAcceptRejectPluginKey = new PluginKey(
  "mass-accept-reject-plugin-key"
);


const getSuggestionCount = (editorState: EditorState): number => {
  const suggestionData = suggestionHighlightPluginKey.getState(editorState);
  return suggestionData?.metaData?.length || 0;
};


export const massAcceptRejectPlugin = new Plugin({
  key: massAcceptRejectPluginKey,
  state: {
    init(_, editorState: EditorState) {
      return {
        currentSuggestionCount: getSuggestionCount(editorState),
      };
    },
    apply(tr, pluginInternalState, oldEditorState, newEditorState) {
      // Apply should primarily update this plugin's own internal state if needed.
      // In this case, we update our tracked count.
      const newCount = getSuggestionCount(newEditorState);
      if (newCount !== pluginInternalState.currentSuggestionCount) {
        console.log(
          `massAcceptRejectPlugin: apply - count changed to ${newCount}`
        );
        return { currentSuggestionCount: newCount };
      }
      return pluginInternalState;
    },
  },
  view(editorView: EditorView) {
    // This function is called when the plugin is added to an editor view.
    console.log("massAcceptRejectPlugin: view created");

    // Initial sync
    const initialCount = getSuggestionCount(editorView.state);
    useEditorStore.getState().setTotalCurrentEdits(initialCount);
    console.log(
      `massAcceptRejectPlugin: view - initial sync, count: ${initialCount}`
    );

    return {
      update(view: EditorView, prevState: EditorState) {
        // This method is called after the state has been updated.
        // 'prevState' is the state before the transaction(s).
        // 'view.state' is the new state.

        // We can get the old and new count from our plugin's internal state
        // which was updated by apply(), or by re-evaluating from the main editor state.
        const oldPluginInternalState = massAcceptRejectPluginKey.getState(prevState);
        const newPluginInternalState = massAcceptRejectPluginKey.getState(view.state);

        const oldCount = oldPluginInternalState?.currentSuggestionCount || 0;
        const newCount = newPluginInternalState?.currentSuggestionCount || 0;

        if (oldCount !== newCount) {
          console.log(
            `massAcceptRejectPlugin: view.update - Count changed from ${oldCount} to ${newCount}. Updating Zustand.`
          );
          useEditorStore.getState().setTotalCurrentEdits(newCount);
        }
      },
      destroy() {
        console.log("massAcceptRejectPlugin: view destroyed");
        useEditorStore.getState().setTotalCurrentEdits(0);
      },
    };
  },
});