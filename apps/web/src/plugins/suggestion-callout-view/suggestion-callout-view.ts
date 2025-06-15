import { PluginView } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { textHighlightPluginKey } from "../text-highlight-plugin/text-highlight-plugin";
import { useWrisorStore } from "@/store/wrisor";

export class SuggestionControlCallout implements PluginView {
  private suggestionCalloutElement: HTMLDivElement;
  private activeSuggestionId: string | null = null;
  private view: EditorView;

  constructor(editorView: EditorView) {
    this.view = editorView;

    const acceptButton = document.createElement("button");
    acceptButton.classList.add("accept-callout-button");
    acceptButton.textContent = "Accept";

    const rejectButton = document.createElement("button");
    rejectButton.classList.add("reject-callout-button");
    rejectButton.textContent = "Reject";

    acceptButton.addEventListener("click", () => this.handleAcceptSuggestion());
    rejectButton.addEventListener("click", () => this.handleRejectSuggestion());

    const calloutContainer = document.createElement("div");
    calloutContainer.classList.add("callout-container");

    const arrow = document.createElement("div");
    arrow.classList.add("callout-arrow");

    calloutContainer.style.display = "none";
    calloutContainer.style.position = "absolute";

    calloutContainer.appendChild(acceptButton);
    calloutContainer.appendChild(rejectButton);
    calloutContainer.appendChild(arrow)

    this.suggestionCalloutElement = calloutContainer;
    this.view.dom.parentNode?.appendChild(this.suggestionCalloutElement);
  }

  handleAcceptSuggestion() {
    if (!this.activeSuggestionId) return;
    const pluginState = textHighlightPluginKey.getState(this.view.state);
    const suggestion = pluginState?.suggestions.find(
      (s) => s.suggestionId === this.activeSuggestionId
    );
    if (!suggestion) return;

    const tr = this.view.state.tr;

    tr.delete(
      suggestion.strikeThroughRange.from,
      suggestion.strikeThroughRange.to
    );

    tr.setMeta(textHighlightPluginKey, {
      action: "resolve-suggestion",
      suggestionId: this.activeSuggestionId,
    });

    this.view.dispatch(tr);
    this.activeSuggestionId = null
    const { totalCurrentEdits, setTotalCurrentEdits } = useWrisorStore.getState()
    setTotalCurrentEdits(totalCurrentEdits - 1)
  }

  handleRejectSuggestion() {
    if (!this.activeSuggestionId) return;
    const pluginState = textHighlightPluginKey.getState(this.view.state);
    const suggestion = pluginState?.suggestions.find(
      (s) => s.suggestionId === this.activeSuggestionId
    );
    if (!suggestion) return;

    const tr = this.view.state.tr;

    tr.delete(suggestion.highlightRange.from, suggestion.highlightRange.to);

    tr.setMeta(textHighlightPluginKey, {
      action: "resolve-suggestion",
      suggestionId: this.activeSuggestionId,
    });

    this.view.dispatch(tr);
    const { totalCurrentEdits, setTotalCurrentEdits } = useWrisorStore.getState()
    setTotalCurrentEdits(totalCurrentEdits - 1)
  }

  update(view: EditorView): void {
    this.view = view;

    const textHighlightPluginData = textHighlightPluginKey.getState(view.state);

    if (
      !textHighlightPluginData ||
      textHighlightPluginData.suggestions.length === 0
    ) {
      this.suggestionCalloutElement.style.display = "none";
      this.activeSuggestionId = null;
      return;
    }

    const activeSuggestion = textHighlightPluginData.suggestions[0];

    this.activeSuggestionId = activeSuggestion.suggestionId;

    const { to } = activeSuggestion.highlightRange;

    const coords = view.coordsAtPos(to);

    const parentRect = (
      this.view.dom.parentNode as HTMLElement
    ).getBoundingClientRect();
    this.suggestionCalloutElement.style.left = `${
      coords.left - parentRect.left - 20
    }px`;
    this.suggestionCalloutElement.style.top = `${
      coords.top - parentRect.top
    }px`;

    this.suggestionCalloutElement.style.display = "flex";
  }

  destroy(): void {
    this.suggestionCalloutElement.remove();
  }
}
