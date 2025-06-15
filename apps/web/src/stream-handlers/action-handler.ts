import { isValidNode } from "@/lib/misc-editor-helpers";
import { suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { useWrisorStore } from "@/store/wrisor";
import { ActionMessageType, OperationType } from "@/types/stream";
import { EditorView } from "prosemirror-view";

export class ActionHandler {
  private view: EditorView;

  constructor(editorView: EditorView) {
    this.view = editorView;
  }

  processAction(actionMessage: ActionMessageType) {
    const { op, targetId } = actionMessage;

    if (op === OperationType.delete) {
      this.delete(targetId);
      return;
    }

    if (op === OperationType.replace) {
      this.replace(targetId);
      return;
    }

    if (
      op === OperationType.insert_after ||
      op === OperationType.insert_before
    ) {
      const addAction = useWrisorStore.getState().addAction;
      addAction(actionMessage);
      return;
    }
  }

  delete(targetId: string) {
    const foundTargetNode = isValidNode(this.view, targetId);
    if (foundTargetNode) {
      const tr = this.view.state.tr;
      const metaData = {
        type: "deletion-suggestion",
        nodeId: targetId,
      };
      tr.setMeta(suggestionHighlightPluginKey, metaData);
    }

    console.error("Error deleting node: TargetId not found. Doing nothing!!!");
  }

  replace(targetId: string) {
    const foundTargetNode = isValidNode(this.view, targetId);
    if (foundTargetNode) {
      const tr = this.view.state.tr;
      const metaData = {
        type: "deletion-suggestion",
        nodeId: targetId,
      };
      tr.setMeta(suggestionHighlightPluginKey, metaData);
    }

    console.error("Error replacing node: TargetId not found. Doing nothing!!!");
  }
}
