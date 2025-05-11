import { Plugin, PluginKey } from "prosemirror-state";
import { v4 as uuidv4 } from "uuid";

export const ensureNodeIdPluginKey = new PluginKey("ensureNodeIdPlugin");

export const ensureNodeIdPlugin = new Plugin({
  key: ensureNodeIdPluginKey,
  appendTransaction: (transactions, oldState, newState) => {
    const docChanged = transactions.some((tr) => tr.docChanged);
    console.log("Doc is changed in the plugin: ", docChanged);
    if (!docChanged && oldState.doc.eq(newState.doc)) {
      return null;
    }

    let newTr = null;
    let changesMade = false;

    newState.doc.descendants((node, pos) => {
      console.log("NODE from ensure node id = plugin is: ", node)
      if (node.type.spec.attrs && node.type.spec.attrs.nodeId !== undefined) {
        if (node.attrs.nodeId === null || node.attrs.nodeId === undefined) {
          if (!newTr) {
            newTr = newState.tr;
          }
          const freshId = uuidv4();
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
