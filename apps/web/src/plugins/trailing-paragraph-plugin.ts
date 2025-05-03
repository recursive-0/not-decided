import { Plugin } from "prosemirror-state";



export const ensureTrailingParagraphPlugin = new Plugin({
    appendTransaction: (transactions, _, newState) => {
      // Only check if content was modified
      if (!transactions.some(tr => tr.docChanged)) return null;
      
      const { doc, schema } = newState;
      const lastNode = doc.lastChild;
      
      if (!lastNode || lastNode.type !== schema.nodes.paragraph) {
        return newState.tr.insert(
          doc.content.size, 
          schema.nodes.paragraph.create()
        );
      }
      
      return null;
    }
  });