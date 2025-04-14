import { MarkType, Node, type Mark, type Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

interface NodeContextType {
  type: Tags;
  firstList?: boolean;
  startPosition: number;
  contentPosition: number;
  insertNextLiPos?: number;
}

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
  "CHECKBOX" = "CHECKBOX",
  "DELETION" = "DELETION",
  "ADDITION" = "ADDITION",
}

interface MarkContext {
  type: Tags.B | Tags.I | Tags.ICODE;
  startPosition: number;
}

export class IncrementalProsemirrorRenderer {
  private editorView: EditorView | null = null;
  private nodeStack: NodeContextType[] = [];
  private activeMarks: MarkContext[] = [];
  private schema: Schema | null = null;
  private insertionPoint: number | null = null;
  private editorMode: "COMPOSER" | "CHAT" = "COMPOSER";
  private highlighterAdded: boolean = false;
  private shouldHiglightGeneratedContent: boolean = false;
  private successfulGenerations: number = 0;

  constructor(editorView: EditorView, extendedSchema: Schema) {
    this.editorView = editorView;
    this.schema = extendedSchema;
  }

  public setMode(mode: "COMPOSER" | "CHAT") {
    this.editorMode = mode;
  }

  public updateSuccessfulGenerations() {
    this.successfulGenerations++;
    return this.successfulGenerations;
  }

  public setHighlight(flag: boolean) {
    this.shouldHiglightGeneratedContent = flag;
  }

  public cleanupAfterStreamStop() {
    if (
      this.nodeStack.length > 0 &&
      this.nodeStack[this.nodeStack.length - 1].type === Tags.ADDITION
    ) {
      this.nodeStack = [];
      this.activeMarks = [];
    }
  }

  //todo: need to improvise the method and make it robust
  public setInsertionPoint(targetedPos: number) {
    if (this.editorMode !== "COMPOSER" || !this.editorView || !this.schema) {
      console.warn(
        "setInsertionPoint: Not in COMPOSER mode or view/schema missing."
      );
      return;
    }

    this.insertionPoint = targetedPos;
  }

  private isMarkTag(tag: Tags): boolean {
    return tag === Tags.B || tag === Tags.I || tag === Tags.ICODE;
  }

  createListNode(type: "ul" | "ol") {
    if (type === "ul") {
      const bulletList = this.schema.nodes.bullet_list.create();
      return bulletList;
    }

    if (type === "ol") {
      const orderedList = this.schema.nodes.ordered_list.create();
      return orderedList;
    }
  }

  onOpenTag(tag: Tags) {
    if (this.isMarkTag(tag)) {
      const pos = this.getInsertPosition();
      this.activeMarks.push({
        type: tag as Tags.B | Tags.I | Tags.ICODE,
        startPosition: pos,
      });
    } else {
      if (this.shouldHiglightGeneratedContent) {
        const node = this.buildProsemirrorNode(Tags.ADDITION);
        this.insertAdditionSuggestionContainer(node);
      }
      const node = this.buildProsemirrorNode(tag);
      this.insertAndUpdateNodeContext(node, tag);
    }
  }

  onCloseTag(tag: Tags) {
    // handle marks and tags differently
    if (this.isMarkTag(tag)) {
      if (this.activeMarks.length === 0) return;
      const topTag = this.activeMarks[this.activeMarks.length - 1];
      if (topTag.type === tag) {
        this.activeMarks.pop();
      } else {
        console.error(`Error: Couldn't find closing ${tag} in active marks stack`)
        throw new Error("Error: finding matching close mark tag");
      }
      return;
    }


    const lastNode = this.nodeStack[this.nodeStack.length - 1];

    // this case should never happen. It'll be stopped from the parser itself
    // if (!lastNode || lastNode.type !== tag) {
    //   const insertPos = this.getInsertPosition();
    //   const tr = this.editorView.state.tr
    //     .insertText(`[${tag}]`, insertPos)
    //     .setMeta("isStreaming", true);
    //   this.editorView.dispatch(tr);
    //   console.warn(`Invalid closing tag: ${tag}`);
    //   return;
    // }

    if (tag === Tags.QUOTE) {
      this.closeQuote();
      return;
    }

    if (tag === Tags.UL) {
      this.closeUnorderedList();
      return;
    }

    if (tag === Tags.OL) {
      this.closeOrderedList();
      return;
    }

    if (tag === Tags.LI) {
      this.closeListItem();
      return;
    }

    this.nodeStack.pop();

    if (this.nodeStack.length > 0) {
      const parentNode = this.nodeStack[this.nodeStack.length - 1];
      const insertPos = lastNode.contentPosition + 1
      parentNode.contentPosition = insertPos
    }
  }

  onTextContent(txt: string) {
    let textToInsert = txt;
    if (txt.length === 0) return;

    let tr = this.editorView.state.tr;

    if (this.nodeStack.length === 0) {
      console.warn("MESSED UP. Can't Insert text without a parent node!!!");
      textToInsert = textToInsert.replace(/\n+/g, "");
      const insertPos = this.getInsertPosition();
      tr.insertText(textToInsert, insertPos).setMeta("isStreaming", true);
    } else {
      if (this.nodeStack[this.nodeStack.length - 1].type !== Tags.CODE) {
        textToInsert = textToInsert.replace(/\n+/g, "");
      }
      if (textToInsert.length === 0) return;

      const insertPos = this.getInsertPosition();
      const mappedInsertPos = tr.mapping.map(insertPos);
      const endPos = mappedInsertPos + textToInsert.length;

      tr.insertText(textToInsert, mappedInsertPos).setMeta("isStreaming", true);

      const currentRendererActiveMarkTypes = new Set(
        this.activeMarks.map((m) => m.type)
      );

      const marksToAdd: Mark[] = [];
      if (currentRendererActiveMarkTypes.has(Tags.B)) {
        this.schema.marks.strong &&
          marksToAdd.push(this.schema.marks.strong.create());
      }
      if (currentRendererActiveMarkTypes.has(Tags.I)) {
        this.schema.marks.em && marksToAdd.push(this.schema.marks.em.create());
      }
      if (currentRendererActiveMarkTypes.has(Tags.ICODE)) {
        try {
          console.log("WILL RENDER INLINE CODE");
          this.schema.marks.inline_code &&
            marksToAdd.push(this.schema.marks.inline_code.create());
        } catch (e) {
          console.log("GOT ITTTTTTTTT", e);
        }
      }

      const possibleMarkTypes = [
        this.schema.marks.strong,
        this.schema.marks.em,
        this.schema.marks.inline_code,
      ].filter((mt): mt is MarkType => !!mt);

      marksToAdd.forEach((markInstance) => {
        tr.addMark(insertPos, endPos, markInstance);
      });

      const activeMarkTypeNames = new Set(marksToAdd.map((m) => m.type.name));
      possibleMarkTypes.forEach((markType) => {
        if (!activeMarkTypeNames.has(markType.name)) {
          tr.removeMark(insertPos, endPos, markType);
        }
      });

      if (this.nodeStack.length > 0) {
        const currentNode = this.nodeStack[this.nodeStack.length - 1];
        currentNode.contentPosition = endPos;
      }
    }

    this.editorView.dispatch(tr);
  }

  closeListItem() {
    const topNode = this.nodeStack[this.nodeStack.length - 1];
    const parentNode = this.nodeStack[this.nodeStack.length - 2];

    if(topNode.type === Tags.LI){
      // simple list
      const currentPos = topNode.contentPosition
      const insertPos = currentPos + 1
      parentNode.contentPosition = insertPos

      this.nodeStack.pop()
      return
    }

    if(topNode.type === Tags.P){
      // complex nested listing
      const currentPos = topNode.contentPosition
      const insertPos = currentPos + 2

      const grandParentNode = this.nodeStack[this.nodeStack.length - 3]
      grandParentNode.contentPosition = insertPos

      this.nodeStack.pop() // pop the paragrah
      this.nodeStack.pop() // pop the LI

      return
    }
  }

  closeUnorderedList() {
    const topNode = this.nodeStack[this.nodeStack.length - 1];

    if (topNode.type === Tags.UL) {
      const currentPos = topNode.contentPosition;
      const insertPos = currentPos + 1;

      this.nodeStack.pop();

      if (this.nodeStack.length > 0) {
        const containerNode = this.nodeStack[this.nodeStack.length - 1];
        containerNode.contentPosition = insertPos;
      }
    } else {
      console.warn("TAG MISMATCH: ", Tags.UL);
    }
  }

  closeOrderedList() {
    const topNode = this.nodeStack[this.nodeStack.length - 1];

    if (topNode.type === Tags.OL) {
      const currentPos = topNode.contentPosition;
      const insertPos = currentPos + 1;

      this.nodeStack.pop();

      if (this.nodeStack.length > 0) {
        const containerNode = this.nodeStack[this.nodeStack.length - 1];
        containerNode.contentPosition = insertPos;
      }
    } else {
      console.warn("TAG MISMATCH: ", Tags.OL);
    }
  }

  closeQuote() {
    const topNode = this.nodeStack[this.nodeStack.length - 1];
    const insertPos = topNode.contentPosition + 1;

    if (topNode.type === Tags.QUOTE) {
      this.nodeStack.pop();
      if (this.nodeStack.length > 0) {
        const parentNode = this.nodeStack[this.nodeStack.length - 1];
        parentNode.contentPosition = insertPos;
      }
    } else {
      console.warn("TAG MISMATCH: ", Tags.OL);
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
        return this.createListNode("ul");
      case Tags.OL:
        return this.createListNode("ol");
      case Tags.LI:
        const pN = this.schema.nodes.paragraph.create();
        const lN = this.schema.nodes.list_item.create(null, [pN]);
        return lN;
      case Tags.CODE:
        return this.schema.nodes.code_block.create({ language: "bash" });
      case Tags.QUOTE:
        return this.schema.nodes.blockquote.create();
      case Tags.CHECKBOX:
        return this.schema.nodes.checkbox_item.create();
      case Tags.ADDITION:
        const higlighterContainer = this.generateAdditionSuggestionContainer();
        return higlighterContainer;
      default:
        break;
    }
  }

  generateAdditionSuggestionContainer() {
    const suggestionNode =
      this.editorView.state.schema.nodes.addition_suggestion.create({
        id: `exp-suggestion-${Date.now()}`,
        originalNodeType: "EXPERIMENT_CONTAINER",
        originalAttrs: "{}",
      });

    return suggestionNode;
  }

  insertAdditionSuggestionContainer(node: Node) {
    const startPos = this.insertionPoint;
    const insertPos = startPos + 1;

    const tr = this.editorView.state.tr.insert(startPos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.ADDITION,
      startPosition: startPos,
      contentPosition: insertPos,
    });

    this.shouldHiglightGeneratedContent = false;
    this.insertionPoint = null;
  }

  insertAndUpdateNodeContext(node: Node, tag: Tags) {
    if (tag === Tags.UL) {
      this.handleUnorderedListInsertion(node);
      return;
    }

    if (tag === Tags.OL) {
      this.handleOrderedListInsertion(node);
      return;
    }

    if (tag === Tags.LI) {
      this.handleListItemInsertion(node);
      return;
    }

    if (tag === Tags.QUOTE) {
      this.handleQuoteInsertion(node);
      return;
    }

    if (tag === Tags.CHECKBOX) {
      this.handleCheckboxItemInsertion(node);
      return;
    }

    if (tag === Tags.ICODE) {
      this.handleInlineCodeInsertion(node);
      return;
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
    if (this.nodeStack.length > 0) {
      const topNode = this.nodeStack[this.nodeStack.length - 1];
      const invalidParents = [Tags.P, Tags.CODE, Tags.ICODE];
      if (invalidParents.includes(topNode.type)) {
        this.nodeStack.pop(); // pop the P node
        const currentPos = topNode.contentPosition;
        const startPos = currentPos + 1
        const insertPos = currentPos + 2;

        const tr = this.editorView.state.tr.insert(startPos, node);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: insertPos,
        });
      } else {


        const startPos = this.getInsertPosition()

        const tr = this.editorView.state.tr.insert(startPos, node);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: startPos + 1
        })
      }
    } else {
      const insertPos = this.getInsertPosition();
      const newCursorPos = insertPos + 1;

      const tr = this.editorView.state.tr.insert(insertPos, node);
      this.editorView.dispatch(tr);

      this.nodeStack.push({
        type: Tags.UL,
        startPosition: insertPos,
        contentPosition: newCursorPos,
      });
    }
  }

  handleOrderedListInsertion(node: Node) {
    if (this.nodeStack.length > 0) {
      const topNode = this.nodeStack[this.nodeStack.length - 1];
      const invalidParents = [Tags.P, Tags.CODE, Tags.ICODE];
      if (invalidParents.includes(topNode.type)) {
        this.nodeStack.pop(); // pop the P node
        const currentPos = topNode.contentPosition;
        const startPos = currentPos + 1
        const insertPos = currentPos + 2;

        const tr = this.editorView.state.tr.insert(startPos, node);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: insertPos,
        });
      } else {


        const startPos = this.getInsertPosition()

        const tr = this.editorView.state.tr.insert(startPos, node);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: startPos + 1
        })
      }
    } else {
      const insertPos = this.getInsertPosition();
      const newCursorPos = insertPos + 1;

      const tr = this.editorView.state.tr.insert(insertPos, node);
      this.editorView.dispatch(tr);

      this.nodeStack.push({
        type: Tags.UL,
        startPosition: insertPos,
        contentPosition: newCursorPos,
      });
    }
  }

  handleListItemInsertion(node: Node) {
    if (this.isNodeStackEmpty()) {
      throw new Error("Error: LI must have a parent in node stack!!!");
    }

    const topNode = this.nodeStack[this.nodeStack.length - 1];

    // if (topNode.type === Tags.UL || topNode.type === Tags.OL) {
      const insertPos = this.getInsertPosition();
      const listStartPos = insertPos
      const afterListPos = listStartPos + 1
      const paragraphStartPos = afterListPos
      const afterParagraphPos = paragraphStartPos + 1

      const tr = this.editorView.state.tr.insert(insertPos, node);
      this.editorView.dispatch(tr);

      this.nodeStack.push({
        type: Tags.LI,
        startPosition: insertPos,
        contentPosition: insertPos + 1,
      });

      this.nodeStack.push({
        type: Tags.P,
        startPosition: paragraphStartPos,
        contentPosition: afterParagraphPos
      })
    // } else {
    //   console.log("Tried to insert LI but parent is not UL or OL");
    //   if (!topNode.insertNextLiPos) {
    //     console.warn("TOP NODE IS: ", topNode);
    //     throw new Error("Missing insertion position for next list item");
    //   }

    //   const insertPos = topNode.insertNextLiPos;

    //   const tr = this.editorView.state.tr.insert(insertPos, node);
    //   this.editorView.dispatch(tr);

    //   const liStartPos = insertPos;
    //   const pStartPos = liStartPos + 1;
    //   const contentPos = pStartPos + 1;

    //   this.nodeStack.push({
    //     type: Tags.LI,
    //     startPosition: liStartPos,
    //     contentPosition: contentPos,
    //   });
    // }
  }

  handleQuoteInsertion(node: Node) {
    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr;

    tr.insert(insertPos, node);

    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.QUOTE,
      startPosition: insertPos,
      contentPosition: insertPos + 1,
    });
  }

  handleCheckboxItemInsertion(node: Node) {
    const insertPos = this.getInsertPosition();
    const cursorPos = insertPos + 1;

    const tr = this.editorView.state.tr.insert(insertPos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.CHECKBOX,
      startPosition: insertPos,
      contentPosition: cursorPos,
    });
  }

  handleInlineCodeInsertion(node: Node) {
    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr.insert(insertPos, node);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.ICODE,
      startPosition: insertPos,
      contentPosition: insertPos + 1,
    });
  }

  isNodeStackEmpty() {
    return this.nodeStack.length > 0 ? false : true;
  }

  private getInsertPosition(): number {
    if (this.insertionPoint !== null) {
      const insertPos = this.insertionPoint;
      this.insertionPoint = null;
      return insertPos;
    }

    if (this.nodeStack.length === 0) {
      return this.editorView.state.doc.content.size;
    } else {
      return this.nodeStack[this.nodeStack.length - 1].contentPosition;
    }
  }
}
