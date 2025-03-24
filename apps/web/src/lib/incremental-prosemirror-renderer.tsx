import type { Node, Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

export enum Tags {
  "H1" = "H1",
  "H2" = "H2",
  "H3" = "H3",
  "P" = "P",
  "B" = "B",
  "I" = "I",
  "CODE" = "CODE",
}

interface NodeContextType {
  type: Tags;
  startPosition: number;
  contentPosition: number;
}

interface MarkContext {
  type: Tags.B | Tags.I;
  startPosition: number;
}

export class IncrementalProsemirrorRenderer {
  private editorView: EditorView | null = null;
  private nodeStack: NodeContextType[] = [];
  private activeMarks: MarkContext[] = [];
  private schema: Schema | null = null;

  constructor(editorView: EditorView, extendedSchema: Schema) {
    this.editorView = editorView;
    this.schema = extendedSchema;
  }

  private isMarkTag(tag: Tags): boolean {
    return tag === Tags.B || tag === Tags.I;
  }

  onOpenTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      const pos = this.getInsertPosition();
      this.activeMarks.push({
        type: tag as Tags.B | Tags.I,
        startPosition: pos,
      });
    } else {
      const node = this.buildProsemirrorNode(tag);
      this.insertAndUpdateNodeContext(node, tag);
    }
  }

  onCloseTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      const markContext = this.activeMarks.pop();
      const tr = this.editorView.state.tr;
      tr.addMark(
        markContext.startPosition,
        this.getInsertPosition(),
        this.schema.marks.strong.create()
      );
      this.editorView.dispatch(tr);
    } else {
      const lastNode = this.nodeStack[this.nodeStack.length - 1];
      if (!lastNode || lastNode.type !== tag) {
        throw new Error(`Invalid closing tag: ${tag}`);
      }

      this.nodeStack.pop();
    }
  }

  onTextContent(txt: string) {
    // Handle newlines intelligently
    let textToInsert = txt;
    
    // Replace sequences of multiple newlines with a single one
    // This will prevent excessive spacing while preserving paragraph structure
    textToInsert = textToInsert.replace(/\n\n+/g, '\n');
    
    // If we're at the beginning of a node's content and the text starts with a newline
    if (this.nodeStack.length > 0) {
        const currentNode = this.nodeStack[this.nodeStack.length - 1];
        if (currentNode.contentPosition === currentNode.startPosition + 1) {
            // Trim all leading newlines at the start of a node
            textToInsert = textToInsert.replace(/^\n+/, '');
        }
    }
    
    // Don't insert anything if we've trimmed everything away
    if (textToInsert.length === 0) return;
    
    const pos = this.getInsertPosition();
    
    const tr = this.editorView.state.tr.insertText(textToInsert, pos);
    this.editorView.dispatch(tr);
    
    if (this.nodeStack.length > 0) {
        const currentNode = this.nodeStack[this.nodeStack.length - 1];
        currentNode.contentPosition += textToInsert.length;
    }
}

  buildProsemirrorNode(tag: Tags) {
    switch (tag) {
      case Tags.H1:
        return this.schema.nodes.heading.create({ level: 1 });
      case Tags.H2:
        return this.schema.nodes.heading.create({ level: 2 });
      case Tags.H3:
        return this.schema.nodes.heading.create({ level: 3 });
      case Tags.P:
        return this.schema.nodes.paragraph.create();
      default:
        break;
    }
  }

  insertAndUpdateNodeContext(node: Node, tag: Tags) {
    const pos = this.getInsertPosition();

    const tr = this.editorView.state.tr.insert(pos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: tag,
      startPosition: pos,
      contentPosition: pos + 1,
    });
  }

  private getInsertPosition(): number {
    if (this.nodeStack.length === 0) {
      return this.editorView.state.doc.content.size;
    } else {
      return this.nodeStack[this.nodeStack.length - 1].contentPosition;
    }
  }
}
