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





export function createInlineCodeSpec(): NodeSpec {
  return {
    
    group: "inline", 
    content: "text*", 
    inline: true, 
    code: true, 
    defining: true, 

    
    marks: "", 
               

    
    toDOM() {
      
      
      return ["code", { class: "inline-code-node" }, 0];
    },

    
    parseDOM: [
      {
        
        tag: "code.inline-code-node"
      },
      {
        
        
        
        tag: "code",
        priority: 50, 
        getAttrs: (domNode) => {
            
            if (domNode instanceof HTMLElement && !domNode.closest('pre.custom-code-block-pre')) {
                
                return {}; 
            }
            return false; 
        }
      }
    ]
  };
}
