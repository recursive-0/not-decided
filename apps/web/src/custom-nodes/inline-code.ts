
import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

export class InlineCodeNodeView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement; 

    constructor(
        public node: Node, 
        public view: EditorView,
        public getPos: () => number | undefined
    ) {
        
        this.dom = document.createElement('code');
        this.dom.classList.add("inline-code-node"); 

        
        this.contentDOM = this.dom;

        
    }

    
    
    
    
    
    
    

    
    
    
    
    
}