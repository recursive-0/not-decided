import type { EditorView } from "prosemirror-view";

interface PositionCallbacks {
  [id: string]: () => number | undefined;
}

type PositionCallback = () => number | undefined;

export class EditsSuggestionsManager {
  public editSuggestionIds: string[] = [];
  private positionCallbacks: PositionCallbacks = {}
  private editorView: EditorView | null = null;

  constructor(view: EditorView){
    this.editorView = view
  }

  public addPositionCallback(id: string, cb: PositionCallback) {
    this.positionCallbacks[id] = cb;
  }

  public totalEdits(): number{
    const length = this.editSuggestionIds.length
    return length
  }

  public addPositionId(id: string) {
    this.editSuggestionIds.push(id);
  }

  public acceptAll() {
    if (!this.editorView || !this.positionCallbacks) return;

    const positionsToProcess = [];

    for (const id of this.editSuggestionIds) {
      const getPos = this.positionCallbacks[id];
      if (!getPos) continue;

      const pos = getPos();
      if (pos === undefined) continue;

      const node = this.editorView.state.doc.nodeAt(pos);
      if (!node) continue;

      positionsToProcess.push({
        id,
        pos,
        nodeSize: node.nodeSize,
        content: node.content,
      });
    }

    positionsToProcess.sort((a, b) => b.pos - a.pos);

    let tr = this.editorView.state.tr;

    for (const { pos, nodeSize, content } of positionsToProcess) {
      const nodeType = this.editorView.state.doc.nodeAt(pos)?.type.name;

      if (nodeType === "addition_suggestion") {
        if (content.size > 0) {
          tr = tr.replaceWith(pos, pos + nodeSize, content);
        } else {
          tr = tr.delete(pos, pos + nodeSize);
        }
      } else if (nodeType === "deletion_suggestion") {
        tr = tr.delete(pos, pos + nodeSize);
      }
    }

    this.editorView.dispatch(tr);

    this.editSuggestionIds = [];
    this.positionCallbacks = {};
  }

  public rejectAll() {
    if (!this.editorView || !this.positionCallbacks) return;

    const positionsToProcess = [];

    for (const id of this.editSuggestionIds) {
      const getPos = this.positionCallbacks[id];
      if (!getPos) continue;

      const pos = getPos();
      if (pos === undefined) continue;

      const node = this.editorView.state.doc.nodeAt(pos);
      if (!node) continue;

      positionsToProcess.push({
        id,
        pos,
        nodeSize: node.nodeSize,
        content: node.content,
        type: node.type.name,
      });
    }

    positionsToProcess.sort((a, b) => b.pos - a.pos);

    let tr = this.editorView.state.tr;

    for (const { pos, nodeSize, content, type } of positionsToProcess) {
      if (type === "addition_suggestion") {
        tr = tr.delete(pos, pos + nodeSize);
      } else if (type === "deletion_suggestion") {
        if (content.size > 0) {
          tr = tr.replaceWith(pos, pos + nodeSize, content);
        } else {
          tr = tr.delete(pos, pos + nodeSize);
        }
      }
    }

    this.editorView.dispatch(tr);

    this.editSuggestionIds = [];
    this.positionCallbacks = {};
  }

}
