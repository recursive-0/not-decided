import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const persistentHighlightKey = new PluginKey("persistent-highlight-key");

export const persistentHighlightPlugin = new Plugin({
  key: persistentHighlightKey,
  props: {
    decorations(state) {
      if (!state.selection.empty) {
        const { from, to } = state.selection;

        console.log(`Applying persistent highlight from ${from} to ${to}`);

        const dec = Decoration.inline(from, to, {
          class: "persistent-selection-highlight",
        });

        return DecorationSet.create(state.doc, [dec]);
      } else {
        return DecorationSet.empty;
      }
    },
  },
});
