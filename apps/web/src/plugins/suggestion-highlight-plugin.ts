import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

export interface MetaDataType {
  type: "addition" | "deletion" | "normal" | "replace";
  nodeId: string | null;
}

interface HighlightNodeActionType {
  type:
    | "removeNode"
    | "removeDecoration"
    | "normal"
    | "acceptAll"
    | "rejectAll"
    | "clearAllSuggestionHighlights"
  nodeId: string | null;
}

export interface SuggestionHighlightPluginState {
  action: HighlightNodeActionType;
  metaData: MetaDataType[];
}

export interface SuggestionHighlightMetaDataType {
  action: HighlightNodeActionType;
  metaData: MetaDataType;
}

export const defaultActionData: HighlightNodeActionType = {
  type: "normal",
  nodeId: null,
};

export const defaultMetaData: HighlightNodeActionType = {
  type: "normal",
  nodeId: null,
};

export const suggestionHighlightPluginKey =
  new PluginKey<SuggestionHighlightPluginState>(
    "suggestion-highlight-plugin-key"
  );

  export const handleRejectAllAction = (
    tr: Transaction,
    editorState: EditorState,
    currentSuggestions: MetaDataType[]
  ): Transaction => {
    const doc = editorState.doc;
    const rangesToDelete: { from: number; to: number }[] = [];
  
    if (currentSuggestions && currentSuggestions.length > 0) {
      currentSuggestions.forEach((suggestionNode) => {
        // For "rejectAll", an "addition" suggestion is deleted
        if (suggestionNode.type === "addition") {
          const nodeId = suggestionNode.nodeId;
          let nodeFoundAndRangeAdded = false;
          doc.descendants((node: Node, pos: number) => {
            if (nodeFoundAndRangeAdded) return false; 
  
            if (node.attrs.nodeId === nodeId) {
              rangesToDelete.push({ from: pos, to: pos + node.nodeSize });
              nodeFoundAndRangeAdded = true;
              return false; 
            }
            return true; 
          });
        }
      });
    }
  
    // Sort ranges in reverse order to avoid position conflicts during deletion
    rangesToDelete.sort((a, b) => b.from - a.from);
  
    // Apply deletions
    rangesToDelete.forEach(range => {
      tr.deleteRange(range.from, range.to);
    });
  
    return tr;
  };
  
  export const handleAcceptAllAction = (
    tr: Transaction,
    editorState: EditorState,
    currentSuggestions: MetaDataType[]
  ): Transaction => {
    console.log('[AcceptAll] Initial currentSuggestions:', JSON.parse(JSON.stringify(currentSuggestions))); // Deep copy for logging
    const doc = editorState.doc;
    const rangesToDelete: { from: number; to: number; nodeId?: string | null }[] = []; // Added nodeId for logging
  
    if (currentSuggestions && currentSuggestions.length > 0) {
      currentSuggestions.forEach((suggestionNode) => {
        console.log('[AcceptAll] Processing suggestionNode:', JSON.parse(JSON.stringify(suggestionNode)));
        // For "acceptAll", a "deletion" suggestion is applied (node is deleted)
        if (suggestionNode.type === "deletion") {
          console.log('[AcceptAll] Suggestion is of type "deletion", nodeId:', suggestionNode.nodeId);
          const nodeId = suggestionNode.nodeId;
          let nodeFoundAndRangeAdded = false;
          doc.descendants((node: Node, pos: number) => {
            if (nodeFoundAndRangeAdded) return false;
  
            // Log the node being checked and its attrs
            // console.log('[AcceptAll] Checking doc node:', node.type.name, 'at pos', pos, 'with attrs:', JSON.stringify(node.attrs));
  
            if (node.attrs.nodeId === nodeId) {
              console.log(`[AcceptAll] Matched nodeId "${nodeId}" at pos ${pos}. Adding to rangesToDelete.`);
              rangesToDelete.push({ from: pos, to: pos + node.nodeSize, nodeId: nodeId });
              nodeFoundAndRangeAdded = true;
              return false; // Stop descendants search for this specific nodeId
            }
            return true; // Continue searching
          });
          if (!nodeFoundAndRangeAdded) {
              console.warn(`[AcceptAll] NodeId "${nodeId}" of type "deletion" NOT FOUND in document.`);
          }
        } else {
          console.log('[AcceptAll] Suggestion type is not "deletion", skipping delete for nodeId:', suggestionNode.nodeId);
        }
      });
    } else {
      console.log('[AcceptAll] No currentSuggestions to process or array is empty.');
    }
  
    console.log('[AcceptAll] Collected rangesToDelete (before sort):', JSON.parse(JSON.stringify(rangesToDelete)));
  
    if (rangesToDelete.length === 0 && currentSuggestions.some(s => s.type === 'deletion')) {
      console.warn('[AcceptAll] There were "deletion" suggestions, but no ranges were collected for deletion. Check nodeId matching.');
    }
  
    rangesToDelete.sort((a, b) => b.from - a.from);
    console.log('[AcceptAll] Sorted rangesToDelete:', JSON.parse(JSON.stringify(rangesToDelete)));
  
  
    rangesToDelete.forEach(range => {
      console.log(`[AcceptAll] Applying tr.deleteRange from ${range.from} to ${range.to} for nodeId "${range.nodeId}"`);
      try {
        tr.deleteRange(range.from, range.to);
      } catch (e) {
        console.error(`[AcceptAll] Error during tr.deleteRange for nodeId "${range.nodeId}":`, e);
        console.error('[AcceptAll] State at error: tr.doc size:', tr.doc.content.size, 'Range:', range);
      }
    });
  
    console.log(`[AcceptAll] Transaction docChanged after deletions: ${tr.docChanged}`);
    return tr;
  };

export const suggestionHighlightPlugin = new Plugin({
  key: suggestionHighlightPluginKey,
  state: {
    init(): SuggestionHighlightPluginState {
      console.log("Init suggestion higlight plugiun");
      return {
        action: defaultActionData,
        metaData: [],
      };
    },
    apply(
      tr,
      value: SuggestionHighlightPluginState,
    ): SuggestionHighlightPluginState {
      const trMeta: SuggestionHighlightMetaDataType | undefined =
        tr.getMeta(suggestionHighlightPluginKey);

      if (!trMeta) return value;

      // Process actions
      if (trMeta.action) {
        const actionType = trMeta.action.type;
        console.log("[PluginApply] Received action:", actionType, trMeta.action.nodeId);

        if (actionType === "clearAllSuggestionHighlights") {
          console.log("[PluginApply] Clearing all suggestion metadata.");
          // Returning a new state object is important
          return { action: defaultActionData, metaData: [] };
        }

        // Handle individual decoration removal (if triggered from widget clicks)
        if (
          actionType === "removeDecoration" &&
          trMeta.action.nodeId !== null
        ) {
          const nodeIdToRemove = trMeta.action.nodeId;
          const newMetaData = value.metaData.filter(
            (node) => node.nodeId !== nodeIdToRemove
          );
          console.log("[PluginApply] Removing decoration for nodeId:", nodeIdToRemove, "New metaData count:", newMetaData.length);
          return {
            ...value, // retain other parts of value if any
            action: defaultActionData,
            metaData: newMetaData,
          };
        }
      }

      if (
        trMeta.metaData && 
        trMeta.metaData.nodeId != null
      ) {

        if (value.metaData.some(
            (item) =>
              item.nodeId === trMeta.metaData.nodeId && // Ensure trMeta.metaData is MetaDataType here
              item.type === trMeta.metaData.type
          )
        ) {
          console.log("[PluginApply] Duplicate metadata, not adding:", trMeta.metaData);
          return value;
        }

        const newSuggestion: MetaDataType = {
          type: trMeta.metaData.type,
          nodeId: trMeta.metaData.nodeId,
        };

        const newMetaDataList = [...value.metaData, newSuggestion];
        console.log("[PluginApply] Adding new metadata:", newSuggestion, "New metaData count:", newMetaDataList.length);
        return {
          action: defaultActionData,
          metaData: newMetaDataList,
        };
      }
      
      console.log("[PluginApply] No specific action handled, returning current value.");
      return value;
    },
  },
  props: {
    decorations(state: EditorState): DecorationSet | null | undefined {
      const pluginState = suggestionHighlightPluginKey.getState(state);
      console.log("PLUGIN STATE IS: ", pluginState);

      if (!pluginState || pluginState.metaData.length === 0) {
        return DecorationSet.empty;
      }

      const doc = state.doc;

      const decorations: Decoration[] = [];

      pluginState.metaData.forEach((highlightInfo: MetaDataType) => {
        const { type, nodeId } = highlightInfo;

        let nodeFound = false;
        doc.descendants((node: Node, pos: number) => {
          if (node.attrs.nodeId === nodeId) {
            const from = pos;
            const to = pos + node.nodeSize;

            const widgetDomFactory = (view: EditorView): HTMLElement => {
              const actionsContainerElement = document.createElement("div");
              actionsContainerElement.classList.add("actions-container");
              const acceptButton = document.createElement("button");
              acceptButton.classList.add("accept-action-button");
              acceptButton.innerText = "Accept";
              acceptButton.addEventListener("click", () => {
                console.log("Clicked on accpet");
                const tr = state.tr;
                if (type === "deletion") {
                  tr.deleteRange(from, to);
                  view.dispatch(tr);
                } else {
                  tr.setMeta(suggestionHighlightPluginKey, {
                    metaData: defaultMetaData,
                    action: {
                      type: "removeDecoration",
                      nodeId: node.attrs.nodeId,
                    },
                  });
                  view.dispatch(tr);
                }
                view.focus();
              });
              const rejectButton = document.createElement("button");
              rejectButton.classList.add("reject-action-button");
              rejectButton.innerText = "Reject";
              rejectButton.addEventListener("click", () => {
                const tr = state.tr;
                if (type === "deletion") {
                  tr.setMeta(suggestionHighlightPluginKey, {
                    metaData: defaultMetaData,
                    action: {
                      type: "removeDecoration",
                      nodeId: node.attrs.nodeId,
                    },
                  });
                  view.dispatch(tr);
                } else {
                  tr.deleteRange(from, to);
                  view.dispatch(tr);
                }
                view.focus();
              });
              actionsContainerElement.appendChild(acceptButton);
              actionsContainerElement.appendChild(rejectButton);
              return actionsContainerElement;
            };

            let classType = "normal";
            if (type === "addition") {
              classType = "addition-suggestion";
            } else if (type === "deletion") {
              classType = "deletion-suggestion";
            }

            const decoration = Decoration.node(from, to, {
              class: classType,
            });

            const widgetDecoration = Decoration.widget(
              from,
              widgetDomFactory,
              {}
            );

            decorations.push(decoration);
            decorations.push(widgetDecoration);
            nodeFound = true;
            return false;
          }

          if (nodeFound) return false;
        });
      });

      console.log("returning decorations: ", decorations);
      return DecorationSet.create(doc, decorations);
    },
  },
});