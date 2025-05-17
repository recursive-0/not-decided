import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { useEditorStore } from "@/store/editor";

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
      console.log("Init suggestion higlight plugiun");
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
    
      if (!trMeta) return value;
    
      if(trMeta.action){
        // Handle individual node removals
        if(trMeta.action.type === "removeNodeFromMetadata" || trMeta.action.type === "removeDecoration"){
          const targetNodeId = trMeta.action.nodeId
          const updatedSuggestionMetaData = value.suggestionMetaData.filter(
            (suggestionNode) => suggestionNode.nodeId !== targetNodeId
          )
          const { setTotalCurrentEdits } = useEditorStore.getState()
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

          const { setTotalCurrentEdits } = useEditorStore.getState()
          setTotalCurrentEdits(finalMetaData.length)
          
          return {
            currentAction: "nothing", // Reset the action
            suggestionMetaData: finalMetaData
          }
        }
      }
    
      // Handle adding new suggestions
      if (trMeta.metaData && trMeta.metaData.nodeId != null) {
        // Existing code for handling new suggestions...
        if (
          value.suggestionMetaData.some(
            (item) =>
              item.nodeId === trMeta.metaData!.nodeId &&
              item.type === trMeta.metaData!.type
          )
        ) {
          console.log(
            "[PluginApply] Duplicate metadata, not adding:",
            trMeta.metaData
          );
          return value;
        }
    
        const newSuggestion: MetaDataType = {
          type: trMeta.metaData.type,
          nodeId: trMeta.metaData.nodeId,
        };
    
        const newMetaDataList = [...value.suggestionMetaData, newSuggestion];
        console.log(
          "[PluginApply] Adding new metadata:",
          newSuggestion,
          "New metaData count:",
          newMetaDataList.length
        );
        const { setTotalCurrentEdits } = useEditorStore.getState()
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
      console.log("PLUGIN STATE IS: ", pluginState);

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

      console.log("returning decorations: ", decorations);
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






// export const handleRejectAllAction = (
//   tr: Transaction,
//   editorState: EditorState,
//   currentSuggestions: MetaDataType[]
// ): Transaction => {
//   const doc = editorState.doc;
//   const rangesToDelete: { from: number; to: number }[] = [];

//   if (currentSuggestions && currentSuggestions.length > 0) {
//     currentSuggestions.forEach((suggestionNode) => {
//       // For "rejectAll", an "addition" suggestion is deleted
//       if (suggestionNode.type === "addition") {
//         const nodeId = suggestionNode.nodeId;
//         let nodeFoundAndRangeAdded = false;
//         doc.descendants((node: Node, pos: number) => {
//           if (nodeFoundAndRangeAdded) return false;

//           if (node.attrs.nodeId === nodeId) {
//             rangesToDelete.push({ from: pos, to: pos + node.nodeSize });
//             nodeFoundAndRangeAdded = true;
//             return false;
//           }
//           return true;
//         });
//       }
//     });
//   }

//   // Sort ranges in reverse order to avoid position conflicts during deletion
//   rangesToDelete.sort((a, b) => b.from - a.from);

//   // Apply deletions
//   rangesToDelete.forEach((range) => {
//     tr.deleteRange(range.from, range.to);
//   });

//   return tr;
// };

// export const handleAcceptAllAction = (
//   tr: Transaction,
//   editorState: EditorState,
//   currentSuggestions: MetaDataType[]
// ): Transaction => {
//   console.log(
//     "[AcceptAll] Initial currentSuggestions:",
//     JSON.parse(JSON.stringify(currentSuggestions))
//   ); // Deep copy for logging
//   const doc = editorState.doc;
//   const rangesToDelete: { from: number; to: number; nodeId?: string | null }[] =
//     []; // Added nodeId for logging

//   if (currentSuggestions && currentSuggestions.length > 0) {
//     currentSuggestions.forEach((suggestionNode) => {
//       console.log(
//         "[AcceptAll] Processing suggestionNode:",
//         JSON.parse(JSON.stringify(suggestionNode))
//       );
//       // For "acceptAll", a "deletion" suggestion is applied (node is deleted)
//       if (suggestionNode.type === "deletion") {
//         console.log(
//           '[AcceptAll] Suggestion is of type "deletion", nodeId:',
//           suggestionNode.nodeId
//         );
//         const nodeId = suggestionNode.nodeId;
//         let nodeFoundAndRangeAdded = false;
//         doc.descendants((node: Node, pos: number) => {
//           if (nodeFoundAndRangeAdded) return false;

//           // Log the node being checked and its attrs
//           // console.log('[AcceptAll] Checking doc node:', node.type.name, 'at pos', pos, 'with attrs:', JSON.stringify(node.attrs));

//           if (node.attrs.nodeId === nodeId) {
//             console.log(
//               `[AcceptAll] Matched nodeId "${nodeId}" at pos ${pos}. Adding to rangesToDelete.`
//             );
//             rangesToDelete.push({
//               from: pos,
//               to: pos + node.nodeSize,
//               nodeId: nodeId,
//             });
//             nodeFoundAndRangeAdded = true;
//             return false; // Stop descendants search for this specific nodeId
//           }
//           return true; // Continue searching
//         });
//         if (!nodeFoundAndRangeAdded) {
//           console.warn(
//             `[AcceptAll] NodeId "${nodeId}" of type "deletion" NOT FOUND in document.`
//           );
//         }
//       } else {
//         console.log(
//           '[AcceptAll] Suggestion type is not "deletion", skipping delete for nodeId:',
//           suggestionNode.nodeId
//         );
//       }
//     });
//   } else {
//     console.log(
//       "[AcceptAll] No currentSuggestions to process or array is empty."
//     );
//   }

//   console.log(
//     "[AcceptAll] Collected rangesToDelete (before sort):",
//     JSON.parse(JSON.stringify(rangesToDelete))
//   );

//   if (
//     rangesToDelete.length === 0 &&
//     currentSuggestions.some((s) => s.type === "deletion")
//   ) {
//     console.warn(
//       '[AcceptAll] There were "deletion" suggestions, but no ranges were collected for deletion. Check nodeId matching.'
//     );
//   }

//   rangesToDelete.sort((a, b) => b.from - a.from);
//   console.log(
//     "[AcceptAll] Sorted rangesToDelete:",
//     JSON.parse(JSON.stringify(rangesToDelete))
//   );

//   rangesToDelete.forEach((range) => {
//     console.log(
//       `[AcceptAll] Applying tr.deleteRange from ${range.from} to ${range.to} for nodeId "${range.nodeId}"`
//     );
//     try {
//       tr.deleteRange(range.from, range.to);
//     } catch (e) {
//       console.error(
//         `[AcceptAll] Error during tr.deleteRange for nodeId "${range.nodeId}":`,
//         e
//       );
//       console.error(
//         "[AcceptAll] State at error: tr.doc size:",
//         tr.doc.content.size,
//         "Range:",
//         range
//       );
//     }
//   });

//   console.log(
//     `[AcceptAll] Transaction docChanged after deletions: ${tr.docChanged}`
//   );
//   return tr;
// };