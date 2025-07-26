import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const persistentHighlightPluginKey = new PluginKey(
  "persistentHighlightPlugin"
);

export const persistentHighlightPlugin = new Plugin({
  key: persistentHighlightPluginKey,
  state: {
    init() {
      return null; // Initial state: no persistent selection
    },
    apply(tr, value) {
      // Check if this transaction wants to set persistent selection
      const meta = tr.getMeta(persistentHighlightPluginKey);
      if (meta) {
        return meta.selection; // Update plugin state
      }
      return value; // Keep existing state
    }
  },
  props: {
    decorations(state) {
      const persistentSelection = this.getState(state);
      
      if (persistentSelection) {
        const { from, to } = persistentSelection;
        const decoration = Decoration.inline(from, to, {
          class: "persistent-selection-highlight",
        });
        return DecorationSet.create(state.doc, [decoration]);
      }
      
      return DecorationSet.empty;
    },
  },
});