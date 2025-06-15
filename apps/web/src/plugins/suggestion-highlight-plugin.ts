import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { useWrisorStore } from "@/store/wrisor";

export interface MetaDataType {
  type: "addition-suggestion" | "deletion-suggestion";
  nodeId: string;
}

interface HighlightNodeActionType {
  type:
    | "removeNodeFromMetadata"
    | "removeDecoration"
    | "applyAllSuggestions"
    | "rejectAllSuggestions"
    | "startAcceptAll"
    | "startRejectAll"
  nodeId: string | null
  nodesToRemove?: string[]
  nodesToUndecorate?: string[]
}

export interface SuggestionHighlightPluginState {
  currentAction: "applyAllSuggestions" | "rejectAllSuggestions" | "nothing"
  suggestionMetaData: MetaDataType[];
}

export interface SuggestionHighlightMetaDataType {

  action?: HighlightNodeActionType;
  metaData?: MetaDataType;
}


export const suggestionHighlightPluginKey =
  new PluginKey<SuggestionHighlightPluginState>(
    "suggestion-highlight-plugin-key"
  );

export const suggestionHighlightPlugin = new Plugin({
  key: suggestionHighlightPluginKey,
  state: {
    init(): SuggestionHighlightPluginState {
      return {
        currentAction: "nothing",
        suggestionMetaData: [],
      };
    },
    apply(
      tr,
      value: SuggestionHighlightPluginState
    ): SuggestionHighlightPluginState {
      const trMeta: SuggestionHighlightMetaDataType | undefined = tr.getMeta(
        suggestionHighlightPluginKey
      );

      console.log("Trmeta is: ", trMeta)
    
      if (!trMeta) return value;
    
      if(trMeta.action){
        // Handle individual node removals
        if(trMeta.action.type === "removeNodeFromMetadata" || trMeta.action.type === "removeDecoration"){
          const targetNodeId = trMeta.action.nodeId
          const updatedSuggestionMetaData = value.suggestionMetaData.filter(
            (suggestionNode) => suggestionNode.nodeId !== targetNodeId
          )
          const { setTotalCurrentEdits } = useWrisorStore.getState()
          setTotalCurrentEdits(updatedSuggestionMetaData.length)
          return {
            currentAction: "nothing",
            suggestionMetaData: updatedSuggestionMetaData
          }
        }
    
        // Handle the start of batch operations
        if(trMeta.action.type === "startAcceptAll"){
          return {
            currentAction: "applyAllSuggestions",
            suggestionMetaData: value.suggestionMetaData
          }
        }
    
        if(trMeta.action.type === "startRejectAll"){
          return {
            currentAction: "rejectAllSuggestions",
            suggestionMetaData: value.suggestionMetaData
          }
        }
    
        // Handle the completion of batch operations
        if(trMeta.action.type === "applyAllSuggestions" || trMeta.action.type === "rejectAllSuggestions"){
          const { nodesToRemove = [], nodesToUndecorate = [] } = trMeta.action;
          
          // Filter out nodes that were removed
          const updatedMetaData = value.suggestionMetaData.filter(
            item => !nodesToRemove.includes(item.nodeId)
          );
          
          // For nodes that should be undecorated, we need to remove them from metadata too
          const finalMetaData = updatedMetaData.filter(
            item => !nodesToUndecorate.includes(item.nodeId)
          );

          const { setTotalCurrentEdits } = useWrisorStore.getState()
          setTotalCurrentEdits(finalMetaData.length)
          
          return {
            currentAction: "nothing", // Reset the action
            suggestionMetaData: finalMetaData
          }
        }
      }
    
      // Handle adding new suggestions
      if (trMeta.metaData && trMeta.metaData.nodeId != null) {
        console.log("Current metadata is: ", trMeta)
        // Existing code for handling new suggestions...
        if (
          value.suggestionMetaData.some(
            (item) =>
              item.nodeId === trMeta.metaData!.nodeId &&
              item.type === trMeta.metaData!.type
          )
        ) {
          return value;
        }
    
        const newSuggestion: MetaDataType = {
          type: trMeta.metaData.type,
          nodeId: trMeta.metaData.nodeId,
        };
    
        const newMetaDataList = [...value.suggestionMetaData, newSuggestion];
        const { setTotalCurrentEdits } = useWrisorStore.getState()
        setTotalCurrentEdits(newMetaDataList.length)
        return {
          currentAction: "nothing",
          suggestionMetaData: newMetaDataList,
        };
      }
    
      return value;
    }
  },
  props: {
    decorations(state: EditorState): DecorationSet | null | undefined {
      const pluginState = suggestionHighlightPluginKey.getState(state);

      if (!pluginState || pluginState.suggestionMetaData.length === 0) {
        return DecorationSet.empty;
      }

      if (pluginState.currentAction === "applyAllSuggestions" || 
        pluginState.currentAction === "rejectAllSuggestions") {
      return DecorationSet.empty;
    }

      const doc = state.doc;
      const decorations: Decoration[] = [];


      pluginState.suggestionMetaData.forEach((highlightInfo: MetaDataType) => {
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
                const tr = state.tr;
                if (type === "deletion-suggestion") {
                  tr.deleteRange(from, to);
                  tr.setMeta(suggestionHighlightPluginKey, {
                    action: {
                      type: "removeNodeFromMetadata",
                      nodeId: node.attrs.nodeId,
                    },
                  });
                  view.dispatch(tr);
                } else {
                  tr.setMeta(suggestionHighlightPluginKey, {
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
                if (type === "deletion-suggestion") {
                  tr.setMeta(suggestionHighlightPluginKey, {
                    action: {
                      type: "removeDecoration",
                      nodeId: node.attrs.nodeId,
                    },
                  });
                  view.dispatch(tr);
                } else {
                  tr.deleteRange(from, to);
                  tr.setMeta(suggestionHighlightPluginKey, {
                    action: {
                      type: "removeNodeFromMetadata",
                      nodeId: node.attrs.nodeId,
                    },
                  });
                  view.dispatch(tr);
                }
                view.focus();
              });
              actionsContainerElement.appendChild(acceptButton);
              actionsContainerElement.appendChild(rejectButton);
              return actionsContainerElement;
            };

            const decoration = Decoration.node(from, to, {
              class: type,
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

      return DecorationSet.create(doc, decorations);
    },
  },
});



export function handleSuggestionBatch(
  view: EditorView, 
  action: 'applyAllSuggestions' | 'rejectAllSuggestions'
) {
  const state = view.state;
  const pluginState = suggestionHighlightPluginKey.getState(state);
  
  if (!pluginState || pluginState.suggestionMetaData.length === 0) {
    return;
  }

  // First, set the action in the plugin state so decorations know to hide
  const tr = state.tr;
  tr.setMeta(suggestionHighlightPluginKey, {
    action: {
      type: action === 'applyAllSuggestions' ? 'startAcceptAll' : 'startRejectAll'
    }
  });
  view.dispatch(tr);
  
  // Get the updated state and create a new transaction
  const updatedState = view.state;
  const newTr = updatedState.tr;
  
  const nodesToRemove: string[] = [];
  const nodesToUndecorate: string[] = [];
  
  // Determine which nodes to remove/undecorate based on action
  pluginState.suggestionMetaData.forEach((highlightInfo: MetaDataType) => {
    const { type, nodeId } = highlightInfo;
    
    if (action === 'applyAllSuggestions') {
      if (type === "deletion-suggestion") {
        nodesToRemove.push(nodeId);
      } else if (type === "addition-suggestion") {
        nodesToUndecorate.push(nodeId);
      }
    } else { // rejectAllSuggestions
      if (type === "addition-suggestion") {
        nodesToRemove.push(nodeId);
      } else if (type === "deletion-suggestion") {
        nodesToUndecorate.push(nodeId);
      }
    }
  });
  
  // Create an array to store positions that need to be deleted
  // This avoids issues with position changes during traversal
  const positionsToDelete: {from: number, to: number}[] = [];
  
  // First pass: collect all positions to delete
  updatedState.doc.descendants((node: Node, pos: number) => {
    if (nodesToRemove.includes(node.attrs.nodeId)) {
      positionsToDelete.push({
        from: pos,
        to: pos + node.nodeSize
      });
    }
    // Always return true to continue traversal
    return true;
  });
  
  // Sort positions in reverse order (delete from end to beginning to avoid position shifts)
  positionsToDelete.sort((a, b) => b.from - a.from);
  
  // Second pass: delete all collected positions
  positionsToDelete.forEach(({from, to}) => {
    newTr.deleteRange(from, to);
  });
  
  // Set final metadata update
  newTr.setMeta(suggestionHighlightPluginKey, {
    action: {
      type: action,
      nodeId: null,
      nodesToRemove,
      nodesToUndecorate
    }
  });
  
  // Only dispatch if there are changes
  if (newTr.docChanged || nodesToUndecorate.length > 0) {
    view.dispatch(newTr);
  }
}





