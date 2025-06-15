import { useUIStore } from "@/store/ui";
import { Plugin, PluginKey } from "prosemirror-state";


export const createTransformationGuardPlugin = () => {
  return new Plugin({
    key: new PluginKey('transformationGuard'),
    
    props: {
      handleKeyDown() {
        const uiStore = useUIStore.getState
        if (uiStore().isTransforming) {
          uiStore().triggerShake();
          return true; 
        }
        return false; 
      },
      
      handleTextInput() {
        const uiStore = useUIStore.getState
        if (uiStore().isTransforming) {
          uiStore().triggerShake();
          return true; // Block text input
        }
        return false;
      },
      
      handlePaste() {
        const uiStore = useUIStore.getState
        if (uiStore().isTransforming) {
          uiStore().triggerShake();
          return true; // Block paste
        }
        return false;
      },
      
      handleDrop() {
        const uiStore = useUIStore.getState
        if (uiStore().isTransforming) {
          uiStore().triggerShake();
          return true; // Block drop
        }
        return false;
      }
    }
  });
};