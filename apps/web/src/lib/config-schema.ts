import { schema } from "prosemirror-schema-basic";
import { createCheckboxSpec, createInlineCodeSpec } from "./schema-helpers";
import { addListNodes } from "prosemirror-schema-list";
import type { MarkSpec } from "prosemirror-model";




let nodesMap = schema.spec.nodes;


nodesMap = nodesMap.addToEnd("checkbox_item", createCheckboxSpec()); 


const originalCodeBlockSpec = nodesMap.get("code_block");

const customCodeBlockSpec = {
    ...originalCodeBlockSpec,
    attrs: {
      language: {
        default: "Text"
      }
    }
  }



nodesMap = nodesMap.update("code_block", customCodeBlockSpec);


export const finalNodes = addListNodes(nodesMap, "paragraph block*", "block");

const inlineCodeMarkSpec: MarkSpec = { // Optionally add MarkSpec type here
  parseDOM: [{ tag: "code" }],
  toDOM() {
    // Use 'as const' to tell TS this is a specific tuple structure
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
  parseDOM: [{tag: "u"}, {style: "text-decoration=line-through"}],
  toDOM(){
    return ["span", {class: "strikethrough-mark"}, 0] as const
  }
}

const textColorMarkSpec: MarkSpec = {
  attrs: { color: { default: '#000000' } },
  parseDOM: [
    {
      style: 'color',
      getAttrs: (value) => ({ color: value }),
    },
  ],
  toDOM(mark) {
    return ['span', { style: `color: ${mark.attrs.color}` }, 0] as const;
  },
};

const highlightMarkSpec: MarkSpec = {
  attrs: { color: { default: '#ffff00' } },
  parseDOM: [
    {
      style: 'background-color',
      getAttrs: (value) => ({ color: value }),
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
};

const subscriptMarkSpec: MarkSpec = {
  parseDOM: [{ tag: 'sub' }],
  toDOM() {
    return ['sub', 0] as const;
  },
};

let baseMarks = schema.spec.marks.remove("code")
baseMarks = baseMarks.addToEnd("underline_mark", underlineMarkSpec)
baseMarks = baseMarks.addToEnd("inline_code", inlineCodeMarkSpec); // Add yours
baseMarks = baseMarks.addToEnd("strikethrough", strikethroughMarkSpec)
baseMarks = baseMarks.addToEnd('text_color', textColorMarkSpec);
baseMarks = baseMarks.addToEnd('highlight', highlightMarkSpec);
baseMarks = baseMarks.addToEnd('superscript', superscriptMarkSpec);
baseMarks = baseMarks.addToEnd('subscript', subscriptMarkSpec);
export const finalMarks = baseMarks

