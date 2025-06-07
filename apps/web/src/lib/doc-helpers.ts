import { EditorView } from "prosemirror-view";



export const getDocumentContext = (editor: EditorView) => {
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    
    return {
      selectedText: doc.textBetween(from, to),
      documentContent: doc.textBetween(0, doc.content.size), 
    };
  };