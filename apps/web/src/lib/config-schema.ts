import { schema } from "prosemirror-schema-basic";
import { createCheckboxSpec } from "./schema-helpers";
import { addListNodes } from "prosemirror-schema-list";




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