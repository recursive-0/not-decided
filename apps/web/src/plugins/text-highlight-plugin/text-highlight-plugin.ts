import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { TransformationControlCallout } from "../transformation-callout-view/transformation-callout-view";
import "./text-highlight-plugin.css";


interface RangeType {
  from: number;
  to: number;
}

export interface TextHighlightPluginType {
  action: "show-transformation" | "resolve-transformation" | "reject-transformation";
  strikeThroughRange: RangeType;
  highlightRange: RangeType;
  originalText: string;
  transformedText: string;
  transformationId: string;
}

interface TextHighlightPluginStateType {
  transformations: TextHighlightPluginType[];
}

export const textHighlightPluginKey =
  new PluginKey<TextHighlightPluginStateType>("text-highlight-plugin-key");
export const applyHighlightKey = "APPLY_TRANSFORMATION_HIGHLIGHT";

export const textHighlightPlugin = new Plugin<TextHighlightPluginStateType>({
  key: textHighlightPluginKey,
  state: {
    init() {
      const initialState = {
        transformations: [],
      };

      return initialState;
    },
    apply(tr, pluginState): TextHighlightPluginStateType {
      console.log("Applying transformation!") 

      const mappedTransformations = pluginState.transformations.map((transformation) => ({
        ...transformation,
        strikeThroughRange: {
          from: tr.mapping.map(transformation.strikeThroughRange.from),
          to: tr.mapping.map(transformation.strikeThroughRange.to),
        },
        highlightRange: {
          from: tr.mapping.map(transformation.highlightRange.from),
          to: tr.mapping.map(transformation.highlightRange.to),
        },
      }));

      const metaData = tr.getMeta(textHighlightPluginKey);

      if (metaData?.action === "show-transformation") {
        return {
          transformations: [...mappedTransformations, metaData],
        };
      }

      if (metaData?.action === "resolve-transformation") {
        const transformationIdToResolve = metaData.transformationId;
        const updatedTransformations = pluginState.transformations.filter(
          (transformation) => transformation.transformationId !== transformationIdToResolve
        );
        return {
          ...pluginState,
          transformations: updatedTransformations,
        };
      }

      return { transformations: mappedTransformations };
    },
  },
  props: {
    decorations(state) {
      const currentState: TextHighlightPluginStateType | undefined =
        this.getState(state);
      if (!currentState) return DecorationSet.empty;
      const { transformations } = currentState;

      if (transformations.length === 0) return DecorationSet.empty;

      const decorations: Decoration[] = [];

      const createStrikeThroughDecoration = (props: RangeType): Decoration => {
        const { from, to } = props;
        return Decoration.inline(from, to, { class: "strike-through-text" });
      };

      const createHighlightDecoration = (props: RangeType): Decoration => {
        const { from, to } = props;
        return Decoration.inline(from, to, {
          class: "highlight-text",
        });
      };

      for (let i = 0; i < transformations.length; i++) {
        const currentSuggestion = transformations[i];

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

  view(editorView) {
    return new TransformationControlCallout(editorView);
  },
});
