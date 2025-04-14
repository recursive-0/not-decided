// Fix for the CheckBoxes NodeView class
import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

export class CheckBoxes implements NodeView {
    public node: Node;
    public view: EditorView;
    public getPos: () => number | undefined;

    dom: HTMLElement;
    contentDOM: HTMLElement;

    private boxElement: HTMLSpanElement;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.createCheckboxNode();
        
        // Set checked attribute based on node's attrs
        this.dom.setAttribute("data-checked", String(node.attrs.checked));
        this.boxElement.setAttribute("checked", String(node.attrs.checked));
        
        // Add click handler
        this.boxElement.addEventListener("click", this.handleClick.bind(this));
    }

    createCheckboxNode() {
        // Create container
        this.dom = document.createElement('div');
        this.dom.classList.add("checkbox-container");
        
        // Create checkbox
        this.boxElement = document.createElement('span');
        this.boxElement.classList.add("checkbox-box");
        
        // Create content wrapper
        this.contentDOM = document.createElement("p");
        this.contentDOM.classList.add("checkbox-paragraph");
        
        // Assemble structure
        this.dom.appendChild(this.boxElement);
        this.dom.appendChild(this.contentDOM);
    }
    
    handleClick(e: MouseEvent) {
        e.preventDefault();
        
        const pos = this.getPos();
        if (typeof pos !== "number") return;
        
        // Toggle checked state
        const { checked } = this.node.attrs;
        const transaction = this.view.state.tr.setNodeAttribute(
            pos, 
            "checked", 
            !checked
        );
        
        this.view.dispatch(transaction);
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        
        // Update checked state if it changed
        if (node.attrs.checked !== this.node.attrs.checked) {
            this.dom.setAttribute("data-checked", String(node.attrs.checked));
            this.boxElement.setAttribute("checked", String(node.attrs.checked));
        }
        
        this.node = node;
        return true;
    }
}

export function createCheckboxSpec() {
    return {
        content: "inline*",
        group: "block",
        draggable: false,
        attrs: {
            checked: {
                default: false
            }
        },
        toDOM(node) {
            return [
                "div",
                {
                    "data-checked": String(node.attrs.checked),
                    "class": "checkbox-container"
                },
                [
                    "span",
                    {
                        checked: String(node.attrs.checked),
                        class: "checkbox-box",
                    },
                ],
                [
                    "p",
                    {
                        class: "checkbox-paragraph"
                    },
                    0
                ]
            ]
        },
        parseDOM: [{
            tag: "div.checkbox-container",
            getAttrs(dom: HTMLElement) {
                return { checked: dom.dataset.checked === "true" }
            },
            contentElement: "p.checkbox-paragraph"
        }]
    }
}