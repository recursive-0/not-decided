import { Node, type Mark, type Schema } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

export enum Tags {
  "H1" = "H1",
  "H2" = "H2",
  "H3" = "H3",
  "P" = "P",
  "B" = "B",
  "I" = "I",
  "UL" = "UL",
  "LI" = "LI",
  "CODE" = "CODE",
  "QUOTE" = "QUOTE"
}

interface NodeContextType {
  type: Tags;
  firstList?: boolean;
  startPosition: number;
  contentPosition: number;
  insertNextLiPos?: number; 
}

interface MarkContext {
  type: Tags.B | Tags.I;
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
    return tag === Tags.B || tag === Tags.I;
  }

  onOpenTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      const pos = this.getInsertPosition();
      this.activeMarks.push({
        type: tag as Tags.B | Tags.I,
        startPosition: pos,
      });
    } else {
      const node = this.buildProsemirrorNode(tag);
      console.log(`NODE for ${tag} is: ${node}`)
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
      console.log(`LAst nnode  for ${tag} is: ", ${JSON.stringify(lastNode)}`)

      if (tag === Tags.QUOTE) {
        // Expect P inside QUOTE
        if (lastNode.type !== Tags.P) {
             throw new Error(`Invalid stack state on closing QUOTE: Expected P at top, found ${lastNode.type}`);
        }
        this.nodeStack.pop(); // Pop P

        const quoteNode = this.nodeStack[this.nodeStack.length - 1];
        if (!quoteNode || quoteNode.type !== Tags.QUOTE) {
             throw new Error(`Invalid stack state on closing QUOTE: Expected QUOTE after P, found ${quoteNode?.type}`);
        }
         this.nodeStack.pop(); // Pop QUOTE
         console.log("Popped P and QUOTE contexts");
         return
      }
      
      if (!lastNode || lastNode.type !== tag) {
        throw new Error(`Invalid closing tag: ${tag}`);
      }
  
      if (tag === Tags.LI) {
        const topULNode = this.nodeStack[this.nodeStack.length - 2]; 
        if (!topULNode || topULNode.type !== Tags.UL) {
          throw new Error("Error updating UL position: UL node not found in node stack");
        }
        
        const currentPos = lastNode.contentPosition;
        
        const nextLiInsertPos = currentPos + 2;
        
        
        topULNode.insertNextLiPos = nextLiInsertPos;
      }

      
      this.nodeStack.pop();
    }
  }

  onTextContent(txt: string) {
    let textToInsert = txt;
    console.log("TEXT IS: ", textToInsert)
    console.log("TEXT LENGHT IS: ", textToInsert.length)
    textToInsert = textToInsert.replace(/\n\n+/g, "\n");

    if (this.nodeStack.length > 0) {
      const currentNode = this.nodeStack[this.nodeStack.length - 1];
      if (currentNode.contentPosition === currentNode.startPosition + 1) {
        textToInsert = textToInsert.replace(/^\n+/, "");
      }
    }

    if (textToInsert.length === 0) return;

    const insertPos = this.getInsertPosition();
    const endPos = insertPos + textToInsert.length;

    const tr = this.editorView.state.tr;

    tr.insertText(textToInsert, insertPos);

    const currentRendererMarks = this.activeMarks
      .map((markContext) => {
        if (markContext.type === Tags.B) {
          return this.schema.marks.strong?.create();
        } else if (markContext.type === Tags.I) {
          return this.schema.marks.em?.create();
        }
        return null;
      })
      .filter((mark): mark is Mark => mark !== null);

    const possibleMarkTypes = [
      this.schema.marks.strong,
      this.schema.marks.em,
    ].filter(Boolean);

    if (currentRendererMarks.length > 0) {
      tr.addMark(insertPos, endPos, currentRendererMarks[0]);
    } else {
      possibleMarkTypes.forEach((markType) => {
        tr.removeMark(insertPos, endPos, markType);
      });
    }

    this.editorView.dispatch(tr);

    if (this.nodeStack.length > 0) {
      const currentNode = this.nodeStack[this.nodeStack.length - 1];
      currentNode.contentPosition = endPos
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
        const zeroWidthSpace = this.schema.text("\u200B");
        const parargaphNode = this.schema.nodes.paragraph.create(null, [
          zeroWidthSpace,
        ]);
        const listItemNode = this.schema.nodes.list_item.create(null, [
          parargaphNode,
        ]);
        const bulletList = this.schema.nodes.bullet_list.create(null, [
          listItemNode,
        ]);
        return bulletList;
      case Tags.LI:
        const pN = this.schema.nodes.paragraph.create();
        const lN = this.schema.nodes.list_item.create(null, [pN]);
        return lN;
      case Tags.CODE:
        return this.schema.nodes.code_block.create({language: "bash"})
      case Tags.QUOTE:
        // const paragraphNode = this.schema.nodes.paragraph.create()
        return this.schema.nodes.blockquote.create()
      default:
        break;
    }
  }

  insertAndUpdateNodeContext(node: Node, tag: Tags) {

    console.log("INSERTING NODE ", tag)

    if (tag === Tags.UL) {
      this.handleUnorderedListInsertion(node);
      return;
    }

    if (tag === Tags.LI) {
      this.handleListItemInsertion(node);
      return;
    }

    if(tag === Tags.QUOTE){
      this.handleQuoteInsertion(node)
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
    // UL could have parents like code block or block quotes so remove this
    // if (!this.isNodeStackEmpty()) {
    //   console.log("Inserting UL failed: Stack contains nodes", this.nodeStack);
    //   throw new Error("Error inserting unordered list");
    // }

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

  handleListItemInsertion(node: Node) {
    if (this.isNodeStackEmpty()) {
      throw new Error("Error inserting LI because node stack is empty");
    }
  
    const topNode = this.nodeStack[this.nodeStack.length - 1];
    if (topNode.type === Tags.UL && topNode.firstList) {
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

  handleQuoteInsertion(node: Node) { // node is initially just <blockquote>
    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr;

    // Insert the blockquote node
    tr.insert(insertPos, node);

    // Create and insert the mandatory paragraph node inside it
    // NOTE: Use createAndFill or add ZWS if you want an initial cursor pos
    const paragraphNode = this.schema.nodes.paragraph.createAndFill(); // Use createAndFill or add ZWS
    if (!paragraphNode) {
         console.error("Failed to create paragraph node for blockquote");
         return; // Or handle error
    }
    // Insert paragraph inside the blockquote (at position insertPos + 1)
    tr.insert(insertPos + 1, paragraphNode);

    // Set selection inside the paragraph (optional but good practice)
    // pos + 1 (enter quote) + 1 (enter para) + paragraphNode.content.size (go to end of initial content, e.g. after ZWS)
    // const cursorPos = insertPos + 1 + 1 + (paragraphNode.content.size || 0);
    // tr.setSelection(TextSelection.create(tr.doc, cursorPos));

    this.editorView.dispatch(tr);

    // --- Update stack AFTER dispatch ---
    // const mappedInsertPos = tr.mapping.map(insertPos); // Map position in case of concurrent changes

    // Push QUOTE context
    this.nodeStack.push({
        type: Tags.QUOTE,
        startPosition: insertPos,
        // contentPosition for QUOTE now marks the start of its inner content
        contentPosition: insertPos + 1
    });

    // Push PARAGRAPH context (inside the quote)
    this.nodeStack.push({
        type: Tags.P, // Representing the paragraph INSIDE the quote
        startPosition: insertPos + 1, // Starts right after blockquote opening tag
        // contentPosition is where text should actually be inserted
        contentPosition: insertPos + 1 + 1 // Start inside the paragraph node
    });
}

  isNodeStackEmpty() {
    return this.nodeStack.length > 0 ? false : true;
  }

  private getInsertPosition(): number {
    if (this.nodeStack.length === 0) {
      console.log("SENDING DOC SIZE")
      return this.editorView.state.doc.content.size;
    } else {
      return this.nodeStack[this.nodeStack.length - 1].contentPosition;
    }
  }
}
