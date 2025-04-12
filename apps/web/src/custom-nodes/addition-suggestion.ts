import type { Node } from "prosemirror-model";
import type { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";

export class AdditionSuggestion implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        // Create main container
        this.dom = document.createElement('div');
        this.dom.className = 'suggestion-container addition-suggestion';
        this.dom.setAttribute('data-suggestion-type', 'addition');
        this.dom.setAttribute('data-suggestion-id', node.attrs.id);

        // Create content container (where Prosemirror will put the content)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'suggestion-content addition-content';
        this.contentDOM = contentContainer;  // Important! This tells Prosemirror where to put content

        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'suggestion-controls';

        // Create accept button
        const acceptButton = document.createElement('button');
        acceptButton.className = 'suggestion-accept';
        acceptButton.title = 'Accept addition';
        acceptButton.textContent = 'Accept';
        acceptButton.addEventListener('click', () => {
            const pos = getPos();
            if (pos === undefined) return;
            
            // When accepting an addition, we keep the content but remove the suggestion wrapper
            if (node.content.size > 0) {
                // Replace the entire suggestion node with just its content
                const tr = view.state.tr.replaceWith(
                    pos,
                    pos + node.nodeSize,
                    node.content
                );
                view.dispatch(tr);
            } else {
                // If there's no content, just remove the node
                const tr = view.state.tr.delete(pos, pos + node.nodeSize);
                view.dispatch(tr);
            }
        });

        // Create reject button
        const rejectButton = document.createElement('button');
        rejectButton.className = 'suggestion-reject';
        rejectButton.title = 'Reject addition';
        rejectButton.textContent = 'Reject';
        rejectButton.addEventListener('click', () => {
            const pos = getPos();
            if (pos === undefined) return;
            
            // When rejecting an addition, we remove the entire node
            const tr = view.state.tr.delete(pos, pos + node.nodeSize);
            view.dispatch(tr);
        });

        // Build the DOM structure
        controlsContainer.appendChild(acceptButton);
        controlsContainer.appendChild(rejectButton);
        
        this.dom.appendChild(contentContainer);
        this.dom.appendChild(controlsContainer);
    }
}