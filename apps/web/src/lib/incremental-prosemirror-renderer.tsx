import { MarkType, Node, type Mark, type Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

export enum Tags {
  "H1" = "H1",
  "H2" = "H2",
  "H3" = "H3",
  "P" = "P",
  "B" = "B",
  "I" = "I",
  "UL" = "UL",
  "OL" = "OL",
  "LI" = "LI",
  "CODE" = "CODE",
  "ICODE" = "ICODE",
  "QUOTE" = "QUOTE",
  "CHECKBOX" = "CHECKBOX"
}

interface NodeContextType {
  type: Tags;
  firstList?: boolean;
  startPosition: number;
  contentPosition: number;
  insertNextLiPos?: number;
}

interface MarkContext {
  type: Tags.B | Tags.I | Tags.ICODE
  startPosition: number;
}

export class IncrementalProsemirrorRenderer {
  private editorView: EditorView | null = null;
  private nodeStack: NodeContextType[] = [];
  private activeMarks: MarkContext[] = [];
  private schema: Schema | null = null;

  constructor(editorView: EditorView, extendedSchema: Schema) {
    this.editorView = editorView;
    this.schema = extendedSchema;
  }

  private isMarkTag(tag: Tags): boolean {
    return tag === Tags.B || tag === Tags.I || tag === Tags.ICODE;
  }

  createListNode(type: "ul" | "ol") {
    const zeroWidthSpace = this.schema.text("\u200B");
    const parargaphNode = this.schema.nodes.paragraph.create(null, [
      zeroWidthSpace,
    ]);
    const listItemNode = this.schema.nodes.list_item.create(null, [
      parargaphNode,
    ]);
    if(type === "ul"){
    const bulletList = this.schema.nodes.bullet_list.create(null, [
      listItemNode,
    ]);
    return bulletList;
  }

  if(type === "ol"){
    const orderedList = this.schema.nodes.ordered_list.create(null, [
      listItemNode,
    ]);
    return orderedList;
  }
  }

  onOpenTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      const pos = this.getInsertPosition();
      if(tag === "ICODE"){
        console.log("PUSHING icode to active marks")
      }
      this.activeMarks.push({
        type: tag as Tags.B | Tags.I | Tags.ICODE,
        startPosition: pos,
      });
    } else {
      const node = this.buildProsemirrorNode(tag);
      console.log(`NODE for ${tag} is: ${node}`);
      this.insertAndUpdateNodeContext(node, tag);
    }
  }

  onCloseTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      if (this.activeMarks.length === 0) return;
      const topTag = this.activeMarks[this.activeMarks.length - 1];
      if (topTag.type === tag) {
        this.activeMarks.pop();
      } else {
        throw new Error("Error: finding matching close mark tag");
      }
    } else {
      const lastNode = this.nodeStack[this.nodeStack.length - 1];
      console.log(`LAst nnode  for ${tag} is: ", ${JSON.stringify(lastNode)}`);

      if (tag === Tags.QUOTE) {
        
        if (lastNode.type !== Tags.P) {
          throw new Error(
            `Invalid stack state on closing QUOTE: Expected P at top, found ${lastNode.type}`
          );
        }
        this.nodeStack.pop(); 

        const quoteNode = this.nodeStack[this.nodeStack.length - 1];
        if (!quoteNode || quoteNode.type !== Tags.QUOTE) {
          throw new Error(
            `Invalid stack state on closing QUOTE: Expected QUOTE after P, found ${quoteNode?.type}`
          );
        }
        this.nodeStack.pop(); 
        console.log("Popped P and QUOTE contexts");
        return;
      }

      if (!lastNode || lastNode.type !== tag) {
        throw new Error(`Invalid closing tag: ${tag}`);
      }

      if (tag === Tags.LI) {
        const parentListNode = this.nodeStack[this.nodeStack.length - 2];
        if (!parentListNode || (parentListNode.type !== Tags.UL && parentListNode.type !== Tags.OL)) {
          throw new Error(
            "Error updating UL position: UL node not found in node stack"
          );
        }

        const currentPos = lastNode.contentPosition;

        const nextLiInsertPos = currentPos + 2;

        parentListNode.insertNextLiPos = nextLiInsertPos;
      }


      this.nodeStack.pop();
    }
  }

  onTextContent(txt: string) {
    let textToInsert = txt;
    if(txt.length === 0) return
    console.log("TEXT IS: ", textToInsert);
    console.log("TEXT LENGHT IS: ", textToInsert.length);

    if(this.nodeStack[this.nodeStack.length - 1].type !== Tags.CODE){
      textToInsert = textToInsert.replace(/\n+/g, "");
    textToInsert = textToInsert.replace(/\n\n+/g, "");

    if (this.nodeStack.length > 0) {
      const currentNode = this.nodeStack[this.nodeStack.length - 1];
      if (currentNode.contentPosition === currentNode.startPosition + 1) {
        textToInsert = textToInsert.replace(/^\n+/, "");
      }
    }

    }
    if (textToInsert.length === 0) return;

    const insertPos = this.getInsertPosition();
    const endPos = insertPos + textToInsert.length;
  
    const tr = this.editorView.state.tr;
    tr.insertText(textToInsert, insertPos);
  
    // --- Mark Handling Section ---
    const currentRendererActiveMarkTypes = new Set(this.activeMarks.map(m => m.type));
  
    // Get MarkType objects from schema based on active tags
    const marksToAdd: Mark[] = [];
    if (currentRendererActiveMarkTypes.has(Tags.B)) {
      this.schema.marks.strong && marksToAdd.push(this.schema.marks.strong.create());
    }
    if (currentRendererActiveMarkTypes.has(Tags.I)) {
      this.schema.marks.em && marksToAdd.push(this.schema.marks.em.create());
    }
    if (currentRendererActiveMarkTypes.has(Tags.ICODE)) { // <--- Add ICODE here
      try{
      console.log("WILL RENDER INLINE CODE")
      this.schema.marks.inline_code && marksToAdd.push(this.schema.marks.inline_code.create());
      } catch (e) {
        console.log("GOT ITTTTTTTTT", e)
      }
    }
  
    // Define all possible mark types managed by the renderer
    const possibleMarkTypes = [
        this.schema.marks.strong,
        this.schema.marks.em,
        this.schema.marks.inline_code // <--- Add ICODE here
    ].filter((mt): mt is MarkType => !!mt); // Ensure they exist in the schema
  
  
    // Apply active marks
    marksToAdd.forEach(markInstance => {
        tr.addMark(insertPos, endPos, markInstance);
    });
  
    // Remove marks that are possible but not currently active
    const activeMarkTypeNames = new Set(marksToAdd.map(m => m.type.name));
    possibleMarkTypes.forEach(markType => {
        if (!activeMarkTypeNames.has(markType.name)) {
            tr.removeMark(insertPos, endPos, markType);
        }
    });
    // --- End Mark Handling Section ---
  
    this.editorView.dispatch(tr);
  
    // Update parent content position (NO CHANGE NEEDED HERE)
    if (this.nodeStack.length > 0) {
      const currentNode = this.nodeStack[this.nodeStack.length - 1];
      // The endPos already reflects the position after the inserted text
      currentNode.contentPosition = endPos;
    }
  }

  buildProsemirrorNode(tag: Tags) {
    switch (tag) {
      case Tags.H1:
        return this.schema.nodes.heading.create({ level: 1 });
      case Tags.H2:
        return this.schema.nodes.heading.create({ level: 2 });
      case Tags.H3:
        return this.schema.nodes.heading.create({ level: 3 });
      case Tags.P:
        return this.schema.nodes.paragraph.create();
      case Tags.UL:
        return this.createListNode("ul")
      case Tags.OL:
        return this.createListNode("ol")
      case Tags.LI:
        const pN = this.schema.nodes.paragraph.create();
        const lN = this.schema.nodes.list_item.create(null, [pN]);
        return lN;
      case Tags.CODE:
        return this.schema.nodes.code_block.create({ language: "bash" });
      case Tags.QUOTE:
        return this.schema.nodes.blockquote.create();
      case Tags.CHECKBOX:
        return this.schema.nodes.checkbox_item.create()
      default:
        break;
    }
  }

  insertAndUpdateNodeContext(node: Node, tag: Tags) {
    console.log("INSERTING NODE ", tag);

    if (tag === Tags.UL) {
      this.handleUnorderedListInsertion(node);
      return;
    }

    if(tag === Tags.OL){
      this.handleOrderedListInsertion(node)
      return
    }

    if (tag === Tags.LI) {
      this.handleListItemInsertion(node);
      return;
    }

    if (tag === Tags.QUOTE) {
      this.handleQuoteInsertion(node);
      return;
    }

    if(tag === Tags.CHECKBOX){
      this.handleCheckboxItemInsertion(node)
      return
    }

    if(tag === Tags.ICODE){
      this.handleInlineCodeInsertion(node)
      return
    }

    const pos = this.getInsertPosition();

    const tr = this.editorView.state.tr.insert(pos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: tag,
      startPosition: pos,
      contentPosition: pos + 1,
    });
  }

  handleUnorderedListInsertion(node: Node) {
    
    const insertPos = this.getInsertPosition();
    const newCursorPos = insertPos + 4;

    const tr = this.editorView.state.tr.insert(insertPos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.UL,
      firstList: true,
      startPosition: insertPos,
      contentPosition: newCursorPos,
    });
  }

  handleOrderedListInsertion(node: Node){
    const insertPos = this.getInsertPosition();
    const newCursorPos = insertPos + 4;

    const tr = this.editorView.state.tr.insert(insertPos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.OL,
      firstList: true,
      startPosition: insertPos,
      contentPosition: newCursorPos,
    });
  }

  handleListItemInsertion(node: Node) {
    if (this.isNodeStackEmpty()) {
      throw new Error("Error inserting LI because node stack is empty");
    }

    const topNode = this.nodeStack[this.nodeStack.length - 1];
    if ((topNode.type === Tags.UL || topNode.type === Tags.OL) && topNode.firstList) {
      topNode.firstList = false;
      this.nodeStack.push({
        type: Tags.LI,
        startPosition: topNode.contentPosition,
        contentPosition: topNode.contentPosition,
      });
    } else {
      if (!topNode.insertNextLiPos) {
        throw new Error("Missing insertion position for next list item");
      }

      const insertPos = topNode.insertNextLiPos;

      const tr = this.editorView.state.tr.insert(insertPos, node);
      this.editorView.dispatch(tr);

      const liStartPos = insertPos;
      const pStartPos = liStartPos + 1;
      const contentPos = pStartPos + 1;

      this.nodeStack.push({
        type: Tags.LI,
        startPosition: liStartPos,
        contentPosition: contentPos,
      });
    }
  }

  handleQuoteInsertion(node: Node) {
    
    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr;

    
    tr.insert(insertPos, node);

    
    
    const paragraphNode = this.schema.nodes.paragraph.createAndFill(); 
    if (!paragraphNode) {
      console.error("Failed to create paragraph node for blockquote");
      return; 
    }
    
    tr.insert(insertPos + 1, paragraphNode);

    
    
    
    

    this.editorView.dispatch(tr);

    
    

    
    this.nodeStack.push({
      type: Tags.QUOTE,
      startPosition: insertPos,
      
      contentPosition: insertPos + 1,
    });

    
    this.nodeStack.push({
      type: Tags.P, 
      startPosition: insertPos + 1, 
      
      contentPosition: insertPos + 1 + 1, 
    });
  }

  handleCheckboxItemInsertion(node: Node){

    const insertPos = this.getInsertPosition()
    const cursorPos = insertPos + 1

    const tr = this.editorView.state.tr.insert(insertPos, node)
    this.editorView.dispatch(tr)

    this.nodeStack.push({
      type: Tags.CHECKBOX,
      startPosition: insertPos,
      contentPosition: cursorPos,
    })
  }

  handleInlineCodeInsertion(node: Node){
    const insertPos = this.getInsertPosition()

    const tr = this.editorView.state.tr.insert(insertPos, node)
    this.editorView.dispatch(tr)

    this.nodeStack.push({
      type: Tags.ICODE,
      startPosition: insertPos,
      contentPosition: insertPos + 1
    })
  }

  isNodeStackEmpty() {
    return this.nodeStack.length > 0 ? false : true;
  }

  private getInsertPosition(): number {
    if (this.nodeStack.length === 0) {
      return this.editorView.state.doc.content.size;
    } else {
      return this.nodeStack[this.nodeStack.length - 1].contentPosition;
    }
  }
}
