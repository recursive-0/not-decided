import { create } from "zustand";

interface UIStore {
  isTransforming: boolean;
  shouldShake: boolean;
  
  startTransformation: () => void;
  endTransformation: () => void;
  triggerShake: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isTransforming: false,
  shouldShake: false,
  
  startTransformation: () => set({ isTransforming: true }),
  endTransformation: () => set({ isTransforming: false, shouldShake: false }),
  
  triggerShake: () => {
    set({ shouldShake: true });
    setTimeout(() => set({ shouldShake: false }), 500);
  }
}));