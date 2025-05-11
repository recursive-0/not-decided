import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";


export class CodeBlock implements NodeView {

    dom: HTMLElement

    contentDOM?: HTMLElement;

    private header: HTMLDivElement;
    private languageDisplay: HTMLSpanElement;
    private copyButton: HTMLButtonElement;
    private codeElement: HTMLElement; 

    constructor(
        public node: Node,
        public view: EditorView,
        public getPos: () => number | undefined
    ){
        const language = this.node.attrs.language || "plaintext"; 
        
        this.dom = document.createElement('div');
        this.dom.classList.add("custom-code-block");
        
        this.dom.classList.add(`language-${language}`);

        this.header = document.createElement('div');
        this.header.classList.add("code-block-header"); 

        this.languageDisplay = document.createElement('span');
        this.languageDisplay.classList.add("code-block-language");
        this.languageDisplay.textContent = language; 

        this.copyButton = document.createElement('button');
        this.copyButton.classList.add("code-block-copy-button")
        this.copyButton.textContent = "Copy"
        

        this.header.appendChild(this.languageDisplay);
        this.header.appendChild(this.copyButton);

        
        const pre = document.createElement('pre');
        this.codeElement = document.createElement('code'); 

        
        this.codeElement.className = `language-${language}`;

        pre.appendChild(this.codeElement);

        this.dom.appendChild(this.header);
        this.dom.appendChild(pre);

        
        
        this.contentDOM = this.codeElement;
    }

}