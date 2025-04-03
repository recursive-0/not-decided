import type { NodeSpec } from "prosemirror-model";


export function createCheckboxSpec(): NodeSpec{

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
                    "data-checked": node.attrs.checked,
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

