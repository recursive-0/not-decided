import { Plugin, PluginKey, Transaction } from "prosemirror-state";
import { nanoid } from 'nanoid'

export const ensureNodeIdPluginKey = new PluginKey("ensureNodeIdPlugin");

export const ensureNodeIdPlugin = new Plugin({
  key: ensureNodeIdPluginKey,
  appendTransaction: (transactions, oldState, newState) => {
    const docChanged = transactions.some((tr) => tr.docChanged);
    if (!docChanged && oldState.doc.eq(newState.doc)) {
      return null;
    }

    let newTr: Transaction = newState.tr
    let changesMade = false;

    newState.doc.descendants((node, pos) => {
      if (node.type.spec.attrs && node.type.spec.attrs.nodeId !== undefined) {
        if (node.attrs.nodeId === null || node.attrs.nodeId === undefined) {
          if (!newTr) {
            newTr = newState.tr;
          }
          const freshId = nanoid(10)
          const newNode = node.type.create(
            { ...node.attrs, nodeId: freshId },
            node.content,
            node.marks
          );
          newTr.replaceWith(pos, pos + node.nodeSize, newNode);
          changesMade = true;
        }
      }
    });

    if (changesMade && newTr) {
      if (!newTr.getMeta(ensureNodeIdPluginKey)) {
        newTr.setMeta(ensureNodeIdPluginKey, { idsEnsured: true });
        return newTr;
      }
    }
    return null;
  },
});
