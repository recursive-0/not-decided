import { NudeTags, ParsedTag } from "@/types/editor";
import { EditorView } from "prosemirror-view";

export const getDocumentContext = (editor: EditorView) => {
  const { from, to } = editor.state.selection
  const doc = editor.state.doc;
  const currentNode = doc.nodeAt(from)
  const currentNodeContent = currentNode!.textContent

  return {
    selectedText: doc.textBetween(from, to),
    surroundingContext: currentNodeContent,
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


export function parseTag(rawInput: string): ParsedTag | null {
  const openingTagRegex = /<(\w+)(.*?)>/;
  const tagMatch = rawInput.match(openingTagRegex)

  console.log("Tag match is: ", tagMatch)

  if(!tagMatch) {
    console.warn("This is not a valid opening tag: ", rawInput)
    return null
  }

  const tag = tagMatch[1] as NudeTags
  const attributesString = tagMatch[2]

  const attributeRegex = /(\w+)="([^"]+)"/g;
  const attributes: Record<string, string> = {};

  for(const attrMatch of attributesString.matchAll(attributeRegex)){
    const key = attrMatch[1]
    const value = attrMatch[2]
    attributes[key] = value
  }

  return { tag, attributes}
}

export function parseClosingTag(rawInput: string): ParsedTag | null {
  const closingTagRegex = /<\/(\w+)>/;
  const tagMatch = rawInput.match(closingTagRegex)

  console.log("Tag match is: ", tagMatch)

  if(!tagMatch) {
    console.warn("This is not a valid closing tag: ", rawInput)
    return null
  }

  const tag = tagMatch[1] as NudeTags
  const attributes: Record<string, string> = {}
  return { tag, attributes }
}

export interface DocContentNodes {
  id: string;
  type: string;
  content: string;
  
}

export function getDocumentContentNodesForContext(editor: EditorView) {
  const doc = editor.state.doc
  const contentNodes: DocContentNodes[] = []

  doc.content.content.forEach((node) => {
    contentNodes.push({
      id: node.attrs.nodeId,
      type: node.type.name,
      content: node.textContent,
    })
  })

  return contentNodes
}