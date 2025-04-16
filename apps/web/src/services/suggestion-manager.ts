import type { EditorView } from "prosemirror-view";

type PositionCallback = () => number | undefined;

export class EditsSuggestionsManager {
  public editSuggestionIds: string[] = [];
  private positionCallbacks: Map<string, PositionCallback> = new Map();
  private editorView: EditorView | null = null;
  private additionCount: number = 0;
  private deletionCount: number = 0;

  constructor(view: EditorView) {
    this.editorView = view;
  }

  public addPositionCallback(id: string, cb: PositionCallback) {
    this.positionCallbacks.set(id, cb);
  }

  public totalEdits(): number {
    return this.editSuggestionIds.length;
  }

  public totalAdditions(): number {
    return this.additionCount;
  }

  public totalDeletions(): number {
    return this.deletionCount;
  }

  public addPositionId(id: string, nodeType?: string) {
    this.editSuggestionIds.push(id);
    
    // Update the counts based on the node type
    if (nodeType === "addition_suggestion") {
      this.additionCount++;
    } else if (nodeType === "deletion_suggestion") {
      this.deletionCount++;
    }
  }

  public removeEdit(id: string, nodeType?: string) {
    this.positionCallbacks.delete(id);
    const updatedSuggestionIds = this.editSuggestionIds.filter(editId => editId !== id);
    this.editSuggestionIds = updatedSuggestionIds;
    
    // Update the counts based on the node type
    if (nodeType === "addition_suggestion") {
      this.additionCount = Math.max(0, this.additionCount - 1);
    } else if (nodeType === "deletion_suggestion") {
      this.deletionCount = Math.max(0, this.deletionCount - 1);
    }
  }

  public acceptAll() {
    if (!this.editorView) return;

    const positionsToProcess = [];

    for (const id of this.editSuggestionIds) {
      const getPos = this.positionCallbacks.get(id);
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
        type: node.type.name
      });
    }

    positionsToProcess.sort((a, b) => b.pos - a.pos);

    let tr = this.editorView.state.tr;

    for (const { pos, nodeSize, content, type } of positionsToProcess) {
      if (type === "addition_suggestion") {
        if (content.size > 0) {
          tr = tr.replaceWith(pos, pos + nodeSize, content);
        } else {
          tr = tr.delete(pos, pos + nodeSize);
        }
      } else if (type === "deletion_suggestion") {
        tr = tr.delete(pos, pos + nodeSize);
      }
    }

    this.editorView.dispatch(tr);

    // Reset tracking counts
    this.editSuggestionIds = [];
    this.positionCallbacks.clear();
    this.additionCount = 0;
    this.deletionCount = 0;
  }

  public rejectAll() {
    if (!this.editorView) return;

    const positionsToProcess = [];

    for (const id of this.editSuggestionIds) {
      const getPos = this.positionCallbacks.get(id);
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

    // Reset tracking counts
    this.editSuggestionIds = [];
    this.positionCallbacks.clear();
    this.additionCount = 0;
    this.deletionCount = 0;
  }
}