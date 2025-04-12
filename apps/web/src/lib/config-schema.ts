import { schema as basicSchema } from "prosemirror-schema-basic";
import { createAdditionSuggestionSpec, createCheckboxSpec, createDeletionSuggestionSpec } from "./schema-helpers"; 
import { addListNodes } from "prosemirror-schema-list";
import type { MarkSpec, NodeSpec } from "prosemirror-model"; 



const alignmentAttrs = {
  align: {
    default: null, 
  },
};




const createAlignedToDOM = (tag: string) => {
  return (node) => {
    const { align } = node.attrs;
    
    const style = align && align !== 'left' ? `text-align: ${align};` : null;
    
    return [tag, { style }, 0] as const; 
  };
};


let nodesMap = basicSchema.spec.nodes;


const originalParagraphSpec = nodesMap.get("paragraph") as NodeSpec; 
const updatedParagraphSpec: NodeSpec = {
  ...originalParagraphSpec,
  attrs: {
    ...originalParagraphSpec.attrs, 
    ...alignmentAttrs, 
  },
  toDOM: createAlignedToDOM('p'), 
};
nodesMap = nodesMap.update("paragraph", updatedParagraphSpec);


const originalHeadingSpec = nodesMap.get("heading") as NodeSpec; 
const updatedHeadingSpec: NodeSpec = {
  ...originalHeadingSpec,
  attrs: {
    ...originalHeadingSpec.attrs, 
    ...alignmentAttrs, 
  },
  
  toDOM: (node) => {
    const { align, level } = node.attrs;
    const style = align && align !== 'left' ? `text-align: ${align};` : null;
    return [`h${level}`, { style }, 0] as const; 
  },
};
nodesMap = nodesMap.update("heading", updatedHeadingSpec);


const originalBlockquoteSpec = nodesMap.get("blockquote") as NodeSpec; 
const updatedBlockquoteSpec: NodeSpec = {
  ...originalBlockquoteSpec,
  attrs: {
    ...originalBlockquoteSpec.attrs, 
    ...alignmentAttrs, 
  },
  toDOM: createAlignedToDOM('blockquote'), 
};
nodesMap = nodesMap.update("blockquote", updatedBlockquoteSpec);



nodesMap = nodesMap.addToEnd("checkbox_item", createCheckboxSpec());


const originalCodeBlockSpec = nodesMap.get("code_block") as NodeSpec; 

const customCodeBlockSpec = {
    ...originalCodeBlockSpec,
    attrs: {
      ...originalCodeBlockSpec.attrs, 
      language: { 
        default: "Text"
      }
    }
  }
nodesMap = nodesMap.update("code_block", customCodeBlockSpec);


nodesMap = nodesMap.addToEnd("deletion_suggestion", createDeletionSuggestionSpec());
nodesMap = nodesMap.addToEnd("addition_suggestion", createAdditionSuggestionSpec());


export const finalNodes = addListNodes(nodesMap, "paragraph block*", "block");






const inlineCodeMarkSpec: MarkSpec = {
  parseDOM: [{ tag: "code" }],
  toDOM() {
    return ["code", { class: "inline-code" }, 0] as const;
  }
};

const underlineMarkSpec: MarkSpec = {
  parseDOM: [{tag: "u"}, {style: "text-decoration=underline"}],
  toDOM(){
    return ["span", {class: "underline-mark"}, 0] as const
  }
}


const strikethroughMarkSpec: MarkSpec = {
  parseDOM: [
    {tag: "s"},
    {tag: "del"},
    {tag: "strike"},
    {style: "text-decoration=line-through"},
    {style: "text-decoration-line=line-through"} 
  ],
  toDOM(){
    
    return ["span", {class: "strikethrough-mark", style:"text-decoration: line-through;"}, 0] as const
  }
}

const textColorMarkSpec: MarkSpec = {
  attrs: { color: { default: '#586e75' } }, 
  parseDOM: [
    {
      style: 'color',
      getAttrs: (value) => typeof value === 'string' ? { color: value } : false, 
    },
  ],
  toDOM(mark) {
    return ['span', { style: `color: ${mark.attrs.color}` }, 0] as const;
  },
};

const highlightMarkSpec: MarkSpec = {
  attrs: { color: { default: '#eee8d5' } }, 
  parseDOM: [
    {
      style: 'background-color',
      getAttrs: (value) => typeof value === 'string' ? { color: value } : false,
    },
  ],
  toDOM(mark) {
    return ['span', { style: `background-color: ${mark.attrs.color}` }, 0] as const;
  },
};

const superscriptMarkSpec: MarkSpec = {
  parseDOM: [{ tag: 'sup' }],
  toDOM() {
    return ['sup', 0] as const;
  },
  excludes: "subscript", 
};

const subscriptMarkSpec: MarkSpec = {
  parseDOM: [{ tag: 'sub' }],
  toDOM() {
    return ['sub', 0] as const;
  },
  excludes: "superscript", 
};

const linkMarkSpec: MarkSpec = {
  attrs: {
    href: { default: '' },
    title: { default: null },
    target: { default: '_blank' }  // Opens links in new tab by default
  },
  inclusive: false,  // The link doesn't extend to new text typed after it
  parseDOM: [
    {
      tag: 'a[href]',
      getAttrs(dom) {
        if (!(dom instanceof HTMLElement)) return {};
        return {
          href: dom.getAttribute('href'),
          title: dom.getAttribute('title'),
          target: dom.getAttribute('target')
        };
      }
    }
  ],
  toDOM(mark) {
    const { href, title, target } = mark.attrs;
    return ['a', { href, title, target, rel: 'noopener noreferrer', class: "link" }, 0];
  }
};



let baseMarks = basicSchema.spec.marks;
if (baseMarks.get('code') && inlineCodeMarkSpec) {
  baseMarks = baseMarks.remove('code');
}


baseMarks = baseMarks.addToEnd("underline_mark", underlineMarkSpec)
baseMarks = baseMarks.addToEnd("inline_code", inlineCodeMarkSpec);
baseMarks = baseMarks.addToEnd("strikethrough", strikethroughMarkSpec)
baseMarks = baseMarks.addToEnd('text_color', textColorMarkSpec);
baseMarks = baseMarks.addToEnd('highlight', highlightMarkSpec);
baseMarks = baseMarks.addToEnd('superscript', superscriptMarkSpec);
baseMarks = baseMarks.addToEnd('subscript', subscriptMarkSpec);
baseMarks = baseMarks.addToEnd('link', linkMarkSpec)

export const finalMarks = baseMarks;