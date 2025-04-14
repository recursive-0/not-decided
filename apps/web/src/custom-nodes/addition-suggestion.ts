import type { Node } from "prosemirror-model";
import type { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";

export class AdditionSuggestion implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {

        this.node = node;
        this.view = view;
        this.getPos = getPos;
        
        this.dom = document.createElement('div');
        this.dom.className = 'suggestion-container addition-suggestion';
        this.dom.setAttribute('data-suggestion-type', 'addition');
        this.dom.setAttribute('data-suggestion-id', node.attrs.id);

        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'suggestion-content addition-content';
        this.contentDOM = contentContainer;  

        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'suggestion-controls';

        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'suggestion-accept';
        acceptButton.title = 'Accept addition';
        acceptButton.textContent = 'Accept';

        acceptButton.addEventListener('click', () => {
            const pos = this.getPos();
            if (pos === undefined) return;
            
            // Get the current node from the document
            const nodeAtPos = view.state.doc.nodeAt(pos);
            if (!nodeAtPos) return;
            
            console.log("Node content on accept:", nodeAtPos.content);
            
            if (nodeAtPos.content.size > 0) {
                const tr = view.state.tr.replaceWith(
                    pos,
                    pos + nodeAtPos.nodeSize,
                    nodeAtPos.content
                );
                view.dispatch(tr);
            } else {
                console.warn("Empty content in addition suggestion node");
                const tr = view.state.tr.delete(pos, pos + nodeAtPos.nodeSize);
                view.dispatch(tr);
            }
        });

        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'suggestion-reject';
        rejectButton.title = 'Reject addition';
        rejectButton.textContent = 'Reject';

        rejectButton.addEventListener('click', () => {
            const pos = getPos();
            if (pos === undefined) return;
            console.log("POS IS: ", pos)
            const tr = view.state.tr.delete(pos, pos + node.nodeSize);
            view.dispatch(tr);
        });

        
        controlsContainer.appendChild(acceptButton);
        controlsContainer.appendChild(rejectButton);
        
        this.dom.appendChild(contentContainer);
        this.dom.appendChild(controlsContainer);
    }

    update(node: Node) {
        if (node.type.name !== 'addition_suggestion') return false;
        this.node = node;
        return true;
    }
}