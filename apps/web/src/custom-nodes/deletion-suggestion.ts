import type { Node } from "prosemirror-model";
import type { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";

export class DeletionSuggestion implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        
        this.dom = document.createElement('div');
        this.dom.className = 'suggestion-container deletion-suggestion';
        this.dom.setAttribute('data-suggestion-type', 'deletion');
        this.dom.setAttribute('data-suggestion-id', node.attrs.id);

        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'suggestion-content deletion-content';
        this.contentDOM = contentContainer; 

        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'suggestion-controls';

        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'suggestion-accept';
        acceptButton.title = 'Accept deletion';
        acceptButton.textContent = 'Accept';

        acceptButton.addEventListener('click', () => {
            const pos = getPos();
            if (pos === undefined) return;
            
            // Get the content of the highlighted node
            const contentNode = node.content;
            
            // Replace the highlighted node with its content as normal nodes
            const tr = view.state.tr.replaceWith(
                pos, 
                pos + node.nodeSize, 
                contentNode
            );
            
            view.dispatch(tr);
        });
        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'suggestion-reject';
        rejectButton.title = 'Reject deletion';
        rejectButton.textContent = 'Reject';
        
        rejectButton.addEventListener('click', () => {
            const pos = getPos();
            if (pos === undefined) return;
            
            const tr = view.state.tr.delete(pos, pos + node.nodeSize);
            view.dispatch(tr);
        });

        
        controlsContainer.appendChild(acceptButton);
        controlsContainer.appendChild(rejectButton);
        
        this.dom.appendChild(contentContainer);
        this.dom.appendChild(controlsContainer);
    }
}