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


// Node for content suggested to be deleted
export function createDeletionSuggestionSpec(): NodeSpec {
  return {
    content: "block*",
    group: "block",
    draggable: false,
    attrs: {
      id: { default: "" }, // Unique identifier for the suggestion
      originalNodeType: { default: "" },
      originalAttrs: { default: "{}" }   
    },
    toDOM(node) {
      return [
        "div",
        {
          "data-suggestion-type": "deletion",
          "data-suggestion-id": node.attrs.id,
          "class": "suggestion-container deletion-suggestion"
        },
        [
          "div",
          { class: "suggestion-content deletion-content" },
          0
        ],
        [
          "div",
          { class: "suggestion-controls" },
          [
            "button",
            { 
              class: "suggestion-accept", 
              title: "Accept deletion" 
            },
            "Accept"
          ],
          [
            "button",
            { 
              class: "suggestion-reject", 
              onclick: () => {console.log("CLICKED on REJECT BUTTON: ", node)},
              title: "Reject deletion" 
            },
            "Reject"
          ]
        ]
      ];
    },
    parseDOM: [{
      tag: "div.suggestion-container.deletion-suggestion",
      getAttrs(dom: HTMLElement) {
        return { 
          id: dom.dataset.suggestionId || "",
          originalContent: dom.dataset.originalContent || ""
        };
      },
      contentElement: "div.suggestion-content"
    }]
  };
}

// Node for content suggested to be added
export function createAdditionSuggestionSpec(): NodeSpec {
  return {
    content: "block*",
    group: "block",
    draggable: false,
    attrs: {
      id: { default: "" }, // Unique identifier for the suggestion
      originalNodeType: { default: "" },
      originalAttrs: { default: "{}" }   
    },
    toDOM(node) {
      return [
        "div",
        {
          "data-suggestion-type": "addition",
          "data-suggestion-id": node.attrs.id,
          "class": "suggestion-container addition-suggestion"
        },
        [
          "div",
          { class: "suggestion-content addition-content" },
          0 // Content goes here
        ],
        [
          "div",
          { class: "suggestion-controls" },
          [
            "button",
            { 
              class: "suggestion-accept", 
              title: "Accept addition" 
            },
            "✓"
          ],
          [
            "button",
            { 
              class: "suggestion-reject", 
              title: "Reject addition" 
            },
            "✗"
          ]
        ]
      ];
    },
    parseDOM: [{
      tag: "div.suggestion-container.addition-suggestion",
      getAttrs(dom: HTMLElement) {
        return { 
          id: dom.dataset.suggestionId || "",
          originalContent: dom.dataset.originalContent || ""
        };
      },
      contentElement: "div.suggestion-content"
    }]
  };
}