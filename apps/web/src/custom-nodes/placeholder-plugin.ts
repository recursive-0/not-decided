import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const placeholderPluginKey = new PluginKey("placeholder");

export const placeholderPlugin = new Plugin({
  key: placeholderPluginKey,
  
  state: {
    init(_, state) {
      return getDecorations(state);
    },
    
    apply(tr, old, _, newState) {
      if (tr.docChanged || tr.selectionSet) {
        return getDecorations(newState);
      }
      
      return old;
    }
  },
  
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});


function getDecorations(state) {
  const { doc, selection } = state;
  const decorations: Decoration[] = [];
  
  // Scan all top-level paragraphs in the document
  doc.forEach((node, pos) => {
    if (node.type.name === "paragraph" && node.content.size === 0) {
      // Check if the cursor is in this empty paragraph
      const nodeStart = pos;
      const nodeEnd = pos + node.nodeSize;
      const cursorInNode = selection.empty && 
                           selection.$head.pos >= nodeStart && 
                           selection.$head.pos <= nodeEnd;
      
      // Only add the decoration if the cursor is in this empty node
      if (cursorInNode) {
        decorations.push(
          Decoration.node(nodeStart, nodeEnd, { class: "is-empty" })
        );
      }
    }
  });
  
  return DecorationSet.create(doc, decorations);
}