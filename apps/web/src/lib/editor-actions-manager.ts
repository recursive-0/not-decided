import type { Node, Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

export class EditorActionsManager {
  private editorViewInstance: EditorView | null = null;
  private editorSchema: Schema | null = null;

  constructor(view: EditorView, schema: Schema) {
    this.editorViewInstance = view;
    this.editorSchema = schema;
  }

  private isEmptyParagraph(node: Node): boolean {
    return (
      node.type === this.editorSchema.nodes.paragraph &&
      node.textContent.trim() === ""
    );
  }

  public findTrailingEmptyRange(): { from: number; to: number } | null {
    const endPos = this.editorViewInstance.state.doc.content.size;
    let currentPos = endPos;

    let rangeStartPos: number = -1;

    while (currentPos > 0) {
      const resolvedPos = this.editorViewInstance.state.doc.resolve(currentPos);
      const nodeBeforeCurrentPos = resolvedPos.nodeBefore;

      if (nodeBeforeCurrentPos) {
        if (this.isEmptyParagraph(nodeBeforeCurrentPos)) {
          const nodeStartPos = currentPos - nodeBeforeCurrentPos.nodeSize;

          rangeStartPos = nodeStartPos;

          currentPos = nodeStartPos;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    if (rangeStartPos !== -1) {
      return {
        from: rangeStartPos,
        to: endPos,
      };
    }

    return null;
  }

  public findInitialEmptyRange(): { from: number; to: number } | null {
    let curentPos = 0;
    let endPos = curentPos;
    const doc = this.editorViewInstance.state.doc;

    while (endPos < doc.content.size) {
      const nodeAtPos = doc.nodeAt(curentPos);
      if (this.isEmptyParagraph(nodeAtPos)) {
        endPos = curentPos + nodeAtPos!.nodeSize;
        curentPos = endPos;
      } else {
        break;
      }
    }

    if (endPos > 0) {
      return {
        from: 0,
        to: endPos,
      };
    }

    return null;
  }

  public replaceRange(from: number, to: number, node: Node) {
    const tr = this.editorViewInstance.state.tr.replaceRangeWith(
      from,
      to,
      node
    );
    this.editorViewInstance.dispatch(tr);
  }
}
