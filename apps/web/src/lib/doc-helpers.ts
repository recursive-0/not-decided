import { EditorView } from "prosemirror-view";

export const getDocumentContext = (editor: EditorView) => {
  const { from, to } = getSemanticTextSelectionRange(editor)
  const doc = editor.state.doc;

  return {
    selectedText: doc.textBetween(from, to),
    documentContent: doc.textBetween(0, doc.content.size),
  };
};

export const getSemanticTextSelectionRange = (editor: EditorView) => {
  const { from, to } = editor.state.selection;

  let semanticFrom = from;
  let semanticTo = to;

  const docStart = 0;
  const docEnd = editor.state.doc.content.size;

  
  
  if (semanticFrom > docStart) {
    const charAtFrom = editor.state.doc.textBetween(semanticFrom - 1, semanticFrom);
    
    if (charAtFrom !== " ") {
      
      while (semanticFrom > docStart && editor.state.doc.textBetween(semanticFrom - 1, semanticFrom) !== " ") {
        semanticFrom--;
      }
    } else {
      console.log("✅ FROM already at space boundary");
    }
    
  } else {
    console.log("📍 FROM at document start");
  }

  
  
  if (semanticTo < docEnd) {
    const charAtTo = editor.state.doc.textBetween(semanticTo, semanticTo + 1);
    console.log(`Char after TO position: "${charAtTo}"`);
    
    if (charAtTo !== " ") {
      console.log("❌ TO not at space boundary, expanding right...");
      
      while (semanticTo < docEnd && editor.state.doc.textBetween(semanticTo, semanticTo + 1) !== " ") {
        semanticTo++;
        console.log(`  Expanding right to position ${semanticTo}, char: "${editor.state.doc.textBetween(semanticTo, semanticTo + 1)}"`);
      }
      console.log(`✅ Found word end at position ${semanticTo}`);
    } else {
      console.log("✅ TO already at space boundary");
    }
  } else {
    console.log("📍 TO at document end");
  }

  const finalSelectedText = editor.state.doc.textBetween(semanticFrom, semanticTo);
  console.log("🎯 Final semantic selection:");
  console.log(`Final range: from=${semanticFrom}, to=${semanticTo}`);
  console.log(`Final text: "${finalSelectedText}"`);
  console.log("---");

  return {
    from: semanticFrom,
    to: semanticTo
  };
};
