// import { Plugin, PluginKey } from "prosemirror-state";
// import { Decoration, DecorationSet } from "prosemirror-view";


// const placeholderPluginKey = new PluginKey()

// export const placeholderPlugin = new Plugin({

//     key: placeholderPluginKey,

//     props: {
//         decorations(state) {

//             const decorations: Decoration[] = []
//             const { doc, selection } = state
//             const isCursor = selection.empty
//             if(isCursor){
//                 const { $head } = selection
//                 const showPlaceholder = $head.parent.type.name === "paragraph" && $head.parent.content.size === 0
//                 if(showPlaceholder){
//                     const from = $head.start() - 1
//                     const to = $head.end() + 1

//                    const decorator = Decoration.node(from, to, { class: "is-empty"})
//                    decorations.push(decorator)
//                    return DecorationSet.create(state.doc, decorations)
//                 }
//             }

//             return DecorationSet.empty

//         },
//     }
// })


import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const placeholderPluginKey = new PluginKey("placeholder");

export const placeholderPlugin = new Plugin({
  key: placeholderPluginKey,
  
  state: {
    init(_, state) {
      // Initialize with a full scan of the document
      return getDecorations(state);
    },
    
    apply(tr, old, _, newState) {
      // If the document changed, recalculate all decorations
      if (tr.docChanged) {
        return getDecorations(newState);
      }
      
      // If only the selection changed, we need to recalculate too
      // (for real-time cursor-based placeholder toggling)
      if (tr.selectionSet) {
        return getDecorations(newState);
      }
      
      // Otherwise, reuse the old decorations
      return old;
    }
  },
  
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Helper function to scan the document and create decorations
function getDecorations(state) {
  const { doc, selection } = state;
  const decorations = [];
  
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