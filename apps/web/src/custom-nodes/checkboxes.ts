import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";




export class CheckBoxes implements NodeView {

    public node: Node;
    public view: EditorView
    public getPos: () => number | undefined


    dom: HTMLElement
    contentDOM?: HTMLElement;

    private boxElement: HTMLSpanElement
    private paragraphElement: HTMLParagraphElement

    constructor(node: Node, view: EditorView, getPos: () => number | undefined){
        this.node = node
        this.view = view
        this.getPos = getPos

        this.createCheckboxNode()
    }


    createCheckboxNode(){

        this.dom = document.createElement('div')
        this.dom.classList.add("checkbox-container")

        this.boxElement = document.createElement('span')
        this.boxElement.classList.add("checkbox-box")

        this.paragraphElement = document.createElement("p")
        this.paragraphElement.classList.add("checkbox-paragraph")

        this.dom.appendChild(this.boxElement)
        this.dom.appendChild(this.paragraphElement)

        this.contentDOM = this.dom
    }

}