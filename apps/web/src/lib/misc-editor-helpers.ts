import { Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const validWordRag = /^[A-Za-z]+$/;

export function getWordCount(textContent: string) {
  const words = textContent.split(" ");
  return words.length;
}

export function getAllWords(textContent: string) {
  const allWords = textContent.split(" ");
  console.log("Words are: ", allWords);

  const validWords: string[] = [];

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];

    if (validWordRag.test(word)) {
      validWords.push(word);
    }
  }
  return validWords;
}

interface ValidContentNodes {
  id: string;
  content: {
    type: string;
    content: string;
  };
}

export const getContentNodes = (editorView) => {
  const editorDoc = editorView.state.doc;
  const validContentNodes: ValidContentNodes[] = [];
  const processedTextContent = new Set();

  editorDoc.descendants((node) => {
    const nodeId = node.attrs.nodeId;

    if (nodeId) {
      const isContainer = ["bullet_list", "ordered_list"].includes(
        node.type.name
      );
      const textContent = node.textContent;

      const isParaInListItem =
        node.type.name === "paragraph" &&
        node.parent &&
        node.parent.type.name === "list_item";

      if (
        !isParaInListItem &&
        (isContainer || !processedTextContent.has(textContent))
      ) {
        const contentNode = {
          type: node.type.name,
          content: textContent,
        };
        validContentNodes.push({ id: nodeId, content: contentNode });

        if (!isContainer) {
          processedTextContent.add(textContent);
        }
      }
    }
  });

  return validContentNodes;
};

interface SectionType {
  id: string;
  level: number;
  text: string;
  pos: number;
  icon: string;
}

export const extractSectionsFromEditor = (editorView) => {
  if (!editorView?.current) return [];

  try {
    const doc = editorView.current.state.doc;
    const sections: SectionType[] = [];

    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const level = node.attrs.level || 1;
        const text = node.textContent.trim();

        if (text) {
          sections.push({
            id: `section-${pos}`,
            level,
            text,
            pos,
            icon: level === 1 ? "📄" : level === 2 ? "📝" : "📋",
          });
        }
      }
    });

    return sections;
  } catch (error) {
    console.error("Error extracting sections:", error);
    return [];
  }
};

export function isValidNode(view: EditorView, targetId: string): boolean {
  view.state.doc.descendants((node) => {
    const gotchaTargetNode = node.attrs.nodeId === targetId;
    if (gotchaTargetNode) {
      return true;
    }
  });

  return false;
}

function getNodeProperties(node: ProsemirrorNode | null | undefined) {
  if (!node) {
    return null;
  }
  return {
    type: node.type.name,
    text: node.textContent,
    size: node.nodeSize,
    id: node.attrs.nodeId,
  };
}


export function lockEditor(editorView: EditorView) {
  editorView.setProps({
    editable: () => false,
  });
}

export function unlockEditor(editorView: EditorView) {
  editorView.setProps({
    editable: () => true,
  });
}


interface NodeContextType {
  type: string;
  text: string;
  size: number;
  id: string;
} 

export interface CursorContext {
  currentNode: NodeContextType;
  precedingNode: NodeContextType;
  followingNode: NodeContextType;
  cursorPos: number;
  selectedText: string;
  documentContext: string;
}

export function getContextAroundCursor(state: EditorState): CursorContext {
  const { $head } = state.selection;

  const currentNode = $head.parent;

  const posBefore = $head.before($head.depth);
  const nodeBefore = state.doc.resolve(posBefore).nodeBefore;

  const posAfter = $head.after($head.depth);
  const nodeAfter = state.doc.resolve(posAfter).nodeAfter;

  let parentHeading: ProsemirrorNode | null = null;

  for (let i = $head.depth; i > 0; i--) {
    const parent = $head.node(i);

    if (parent.type.name.startsWith("heading")) {
      parentHeading = parent;
      break;
    }
  }


  const intentContext = {
    currentNode: getNodeProperties(currentNode),
    precedingNode: getNodeProperties(nodeBefore),
    followingNode: getNodeProperties(nodeAfter),
    parentHeading: getNodeProperties(parentHeading),
    cursorPos: $head.pos,
    selectedText: getSelectedText(state),
    documentContext: state.doc.textBetween(0, state.doc.content.size),
  };

  return intentContext as CursorContext;
}


export function getSelectedText(state: EditorState): string | null {
  // Destructure the selection from the state
  const { selection } = state;

  // If the selection is empty (just a cursor), there's no text to get.
  if (selection.empty) {
    return null; // or an empty string "" depending on your use case
  }

  // Get the start and end positions of the selection
  const { from, to } = selection;

  // Use the high-level `textBetween` utility to get the string content.
  const selectedText = state.doc.textBetween(from, to, "\n\n"); // The last arg is a separator for block nodes

  return selectedText;
}