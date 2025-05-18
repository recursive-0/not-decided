import { autoCompletePrefixTree } from "@/lib/autocomplete-prefix-tree";
import { getAllWords } from "@/lib/misc-editor-helpers";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

interface AutoCompletePluginStateType {
  currentSuggestion: string | null;
  prefix: string | null;
  prefixRange: {
    from: number;
    to: number;
  } | null;
  isActive: boolean;
}

function isWordChar(char: string): boolean {
  return /[a-zA-Z0-9_]/.test(char); 
}

export const autoCompletePluginKey = new PluginKey("auto-complete-plugin-key");

export const autoCompletePlugin = new Plugin({
  key: autoCompletePluginKey,
  state: {
    init(): AutoCompletePluginStateType {
      console.log("Autocmplete plugin init");
      const initState = {
        currentSuggestion: null,
        prefix: null,
        prefixRange: null,
        isActive: false,
      };

      return initState;
    },
    apply(tr, value, _, newState) {
      console.log("APPLy INSIDE Auto complete plugin");
      const resetMeta = tr.getMeta(autoCompletePluginKey); // Or suggestionAppliedMetaForKeyDown
      if (
        resetMeta &&
        (resetMeta.suggestionApplied === true ||
          resetMeta.resetAutocomplete === true)
      ) {
        return {
          currentSuggestion: null,
          prefix: null,
          prefixRange: null,
          isActive: false,
        };
      }
      const newTr = newState.tr;

      const contentNodes = newTr.doc.content;

      const allWords: string[] = [];

      contentNodes.forEach((node: Node) => {
        const textContent = node.textContent;
        const words = getAllWords(textContent);
        allWords.push(...words);
      });

      console.log("All WORds are: ", allWords);

      allWords.map((word) => {
        autoCompletePrefixTree.insertCharacters(word);
      });

      // get the current text node based on the cursor position and then iterate backwords till we see the first space or the beginign of the node
      const cursorPos = newState.selection.head; // Use newState
      let currentWordForSuggestions = "";
      let pos = cursorPos - 1;

      while (pos >= 0) {
        const char = newState.doc.textBetween(pos, pos + 1);
        if (isWordChar(char)) {
          currentWordForSuggestions = char + currentWordForSuggestions;
          pos--;
        } else {
          break;
        }
      }

      if (currentWordForSuggestions.length > 0) {
        console.log(
          "Current word being typed for suggestions:",
          currentWordForSuggestions
        );
        const suggestions = autoCompletePrefixTree.getSuggestionsForWord(
          currentWordForSuggestions
        ); // Or similar method
        console.log(
          "Suggestions for current are: ",
          suggestions[suggestions.length - 1]
        );

        const newValue = {
          currentSuggestion: suggestions[suggestions.length - 1],
          prefix: currentWordForSuggestions,
          prefixRange: {
            from: cursorPos - currentWordForSuggestions.length,
            to: cursorPos,
          },
          isActive: true,
        };
        return newValue;
      } else {
        return value;
      }
    },
  },
  props: {
    decorations(editorState) {
      // Receives the entire EditorState
      const pluginState = autoCompletePluginKey.getState(editorState); // Get our plugin's current state

      if (
        pluginState &&
        pluginState.isActive &&
        pluginState.currentSuggestion &&
        pluginState.prefixRange &&
        pluginState.prefix
      ) {
        const ghostText = pluginState.currentSuggestion.substring(
          pluginState.prefix.length
        );
        if (ghostText.length > 0) {
          // Create a widget decoration at the end of the typed prefix
          const decoration = Decoration.widget(
            pluginState.prefixRange.to, // Position to insert the widget
            () => {
              const span = document.createElement("span");
              span.className = "autocomplete-ghost-text";
              span.textContent = ghostText;
              return span;
            }
          );
          return DecorationSet.create(editorState.doc, [decoration]);
        }
      }
      return DecorationSet.empty; // No active suggestion or no ghost text to show
    },
    handleKeyDown(view, event) {
      const pluginState: AutoCompletePluginStateType =
        autoCompletePluginKey.getState(view.state);

      if (
        !pluginState ||
        !pluginState.isActive ||
        !pluginState.currentSuggestion ||
        !pluginState.prefixRange
      ) {
        return false;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const { from, to } = pluginState.prefixRange;
        const suggestionToApply = pluginState.currentSuggestion;

        const tr = view.state.tr;
        tr.insertText(suggestionToApply, from, to);

        tr.setMeta(autoCompletePluginKey, {
          suggestionApplied: true,
          resetAutocomplete: true,
        });

        tr.setMeta("history", false);
        view.dispatch(tr);
        return true;
      }
    },
  },
});
