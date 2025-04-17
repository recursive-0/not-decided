import { create } from "zustand";

interface EditorStore {
    totalCurrentEdits: number
    setTotalCurrentEdits: (newEditsCount: number) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
    totalCurrentEdits: 0,
    setTotalCurrentEdits: (editsCount) => set({totalCurrentEdits: editsCount})
}))

