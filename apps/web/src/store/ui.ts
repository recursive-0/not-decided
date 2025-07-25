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
  }
}));