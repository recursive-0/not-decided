import type { Mark, Node, Schema } from "prosemirror-model";
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
      if(this.activeMarks.length === 0) return
      const topTag = this.activeMarks[this.activeMarks.length - 1]
      if(topTag.type === tag){
        this.activeMarks.pop()
      } else {
        throw new Error("Error: finding matching close mark tag")
        
      }
    } else {
      const lastNode = this.nodeStack[this.nodeStack.length - 1];
      if (!lastNode || lastNode.type !== tag) {
        throw new Error(`Invalid closing tag: ${tag}`);
      }

      this.nodeStack.pop();
    }
  }

  onTextContent(txt: string) {
    let textToInsert = txt;
    textToInsert = textToInsert.replace(/\n\n+/g, '\n');
    
    if (this.nodeStack.length > 0) {
        const currentNode = this.nodeStack[this.nodeStack.length - 1];
        if (currentNode.contentPosition === currentNode.startPosition + 1) {
            textToInsert = textToInsert.replace(/^\n+/, '');
        }
    }
    

    if (textToInsert.length === 0) return;

    const insertPos = this.getInsertPosition();
    const endPos = insertPos + textToInsert.length;

    const tr = this.editorView.state.tr;

    tr.insertText(textToInsert, insertPos);

    const currentRendererMarks = this.activeMarks.map(markContext => {
        if (markContext.type === Tags.B) {
            return this.schema.marks.strong?.create();
        } else if (markContext.type === Tags.I) {
            return this.schema.marks.em?.create();
        }
        return null;
    }).filter((mark): mark is Mark => mark !== null);

    const possibleMarkTypes = [this.schema.marks.strong, this.schema.marks.em].filter(Boolean); 

    if (currentRendererMarks.length > 0) {
         tr.addMark(insertPos, endPos, currentRendererMarks[0]);

    } else {
        possibleMarkTypes.forEach(markType => {
            tr.removeMark(insertPos, endPos, markType);
        });
    }

    this.editorView.dispatch(tr);

    if (this.nodeStack.length > 0) {
        const currentNode = this.nodeStack[this.nodeStack.length - 1];
        currentNode.contentPosition = endPos;
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