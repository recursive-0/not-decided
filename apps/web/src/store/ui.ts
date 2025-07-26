import { create } from "zustand";

interface UIStore {
  isTransforming: boolean;
  shouldShake: boolean;
  document: {
    words: number;
  },
  setWords: (words: number) => void,
  startTransformation: () => void;
  endTransformation: () => void;
  triggerShake: () => void;
  persistentSelection: { from: number; to: number } | null;
  setPersistentSelection: (range: { from: number; to: number } | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isTransforming: false,
  shouldShake: false,
  document: {
    words: 0,
  },
  setWords: (words: number) => set({ document: { words } }),
  startTransformation: () => set({ isTransforming: true }),
  endTransformation: () => set({ isTransforming: false, shouldShake: false }),
  
  triggerShake: () => {
    set({ shouldShake: true });
    setTimeout(() => set({ shouldShake: false }), 500);
  },
  persistentSelection: null,
  setPersistentSelection: (range: { from: number; to: number } | null) => set({ persistentSelection: range }),
}));