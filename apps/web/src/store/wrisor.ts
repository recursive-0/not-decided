import { ActionMessageType, Mode } from "@/types/stream";
import { create } from "zustand";


interface WrisorStoreType {
    mode: Mode,
    totalCurrentEdits: number,
    actions: Record<string, ActionMessageType> | null,
    activeAction: ActionMessageType | null,
    setCurrentMode: (newMode: Mode) => void,
    setTotalCurrentEdits: (newEditsCount: number) => void,
    addAction: (action: ActionMessageType) => void,
    setActiveAction: (newAction: ActionMessageType | null) => void
}

export const useWrisorStore = create<WrisorStoreType>((set) => ({
    totalCurrentEdits: 0,
    mode: Mode.normal,
    actions: null,
    activeAction: null,
    setTotalCurrentEdits: (editsCount) => set({totalCurrentEdits: editsCount}),
    setCurrentMode(newMode) {
        return set({mode: newMode})
    },
    addAction(action) {
        const newAction = {
            [action.actionId]: action
        }
        return set({actions: {...this.actions, ...newAction}})
    },
    setActiveAction(newAction) {
        return set({activeAction: newAction})
    },
}))

