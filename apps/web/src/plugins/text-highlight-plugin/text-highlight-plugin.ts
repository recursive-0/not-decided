import { Plugin, PluginKey} from "prosemirror-state";
import { Decoration, DecorationSet} from "prosemirror-view";
import { SuggestionControlCallout } from "../suggestion-callout-view/suggestion-callout-view";

interface RangeType {
  from: number;
  to: number;
}

export interface TextHighlightPluginType {
  action: "show-suggestion" | "resolveSuggestion" | "rejectSuggestion";
  strikeThroughRange: RangeType;
  highlightRange: RangeType;
  originalText: string;
  rewrittenText: string;
  suggestionId: string;
}

interface TextHighlightPluginStateType {
  suggestions: TextHighlightPluginType[];
}

export const textHighlightPluginKey =
  new PluginKey<TextHighlightPluginStateType>("text-highlight-plugin-key");
export const applyHighlightKey = "APPLY_SUGGESTION_HIGHLIGHT";

export const textHighlightPlugin = new Plugin<TextHighlightPluginStateType>({
  key: textHighlightPluginKey,
  state: {
    init() {
      const initialState = {
        suggestions: [],
      };

      return initialState;
    },
    apply(tr, pluginState): TextHighlightPluginStateType {
      const mappedSuggestions = pluginState.suggestions.map((suggestion) => ({
        ...suggestion,
        strikeThroughRange: {
          from: tr.mapping.map(suggestion.strikeThroughRange.from),
          to: tr.mapping.map(suggestion.strikeThroughRange.to),
        },
        highlightRange: {
          from: tr.mapping.map(suggestion.highlightRange.from),
          to: tr.mapping.map(suggestion.highlightRange.to),
        },
      }));

      const metaData = tr.getMeta(textHighlightPluginKey);

      if (metaData?.action === "show-suggestion") {
        return {
          suggestions: [...mappedSuggestions, metaData],
        };
      }

      if(metaData?.action === "resolve-suggestion"){
        const suggestionIdToResolve = metaData.suggestionId
        const updatedSuggestions = pluginState.suggestions.filter(suggestion => suggestion.suggestionId !== suggestionIdToResolve)
        return {
            ...pluginState,
            suggestions: updatedSuggestions,
        }
      }

      return { suggestions: mappedSuggestions };
    },
  },
  props: {
    decorations(state) {
      const currentState: TextHighlightPluginStateType | undefined =
        this.getState(state);
      if (!currentState) return DecorationSet.empty;
      const { suggestions } = currentState;

      if (suggestions.length === 0) return DecorationSet.empty;

      const decorations: Decoration[] = [];

      const createStrikeThroughDecoration = (props: RangeType): Decoration => {
        const { from, to } = props;
        return Decoration.inline(from, to, { class: "strike-through-text",  });
      };

      const createHighlightDecoration = (props: RangeType): Decoration => {
        const { from, to } = props;
        return Decoration.inline(from, to, {
          class: "highlight-text-in-green",
        });
      };

      for (let i = 0; i < suggestions.length; i++) {
        const currentSuggestion = suggestions[i];

        const strikeThroughDecoration = createStrikeThroughDecoration(
          currentSuggestion.strikeThroughRange
        );
        const highlightDecoration = createHighlightDecoration(
          currentSuggestion.highlightRange
        );

        decorations.push(strikeThroughDecoration);
        decorations.push(highlightDecoration);
      }

      return DecorationSet.create(state.doc, decorations);
    },
  },

  view(editorView){
    return new SuggestionControlCallout(editorView)
  }

});
