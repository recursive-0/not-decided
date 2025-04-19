import type { EditsSuggestionsManager } from "./services/suggestion-manager";

declare global {
    interface Window {
      suggestionsManager: EditsSuggestionsManager | null;
    }
  }