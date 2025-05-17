import { MarkType, Node, type Mark, type Schema } from "prosemirror-model";
import { TextSelection, type Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { CodeBlockNodeType } from "./composer-mode-parser";
import type { FingerprintManager } from "./fingerprint-manager";
import { v4 as uuidv4 } from "uuid"
import { suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { Tags } from "@/types/editor";


interface NodeContextType {
  type: Tags;
  firstList?: boolean;
  startPosition: number;
  contentPosition: number;
  insertNextLiPos?: number;
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
  private successfulGenerations: number = 0;
  private fingerPrintRef: FingerprintManager | null = null;

  constructor(
    editorView: EditorView,
    extendedSchema: Schema,
    fingerprintRef: FingerprintManager
  ) {
    this.editorView = editorView;
    this.schema = extendedSchema;
    this.fingerPrintRef = fingerprintRef;
  }

  public updateSuccessfulGenerations() {
    this.successfulGenerations++;
    return this.successfulGenerations;
  }

  public cleanupAfterStreamStop() {
    if (
      this.nodeStack.length > 0 &&
      this.nodeStack[this.nodeStack.length - 1].type === Tags.ADD
    ) {
      this.nodeStack = [];
      this.activeMarks = [];
    }
  }

  //todo: need to improvise the method and make it robust
  public setInsertionPoint(targetedPos: number) {
    // if (this.editorMode !== "COMPOSER" || !this.editorView || !this.schema) {
    //   console.warn(
    //     "setInsertionPoint: Not in COMPOSER mode or view/schema missing."
    //   );
    //   return;
    // }

    this.insertionPoint = targetedPos;
  }

  private isMarkTag(tag: Tags): boolean {
    return tag === Tags.B || tag === Tags.I || tag === Tags.ICODE;
  }

  createListNode(type: "ul" | "ol") {

    if(!this.schema) return

    if (type === "ul") {
      const bulletList = this.schema.nodes.bullet_list.create({nodeId: uuidv4()});
      return bulletList;
    }

    if (type === "ol") {
      const orderedList = this.schema.nodes.ordered_list.create({nodeId: uuidv4()});
      return orderedList;
    }
  }

  onOpenTag(tag: Tags) {
    console.log("OPEN TAG FOUND IS: ", tag)
    if (this.isMarkTag(tag)) {
      const pos = this.getInsertPosition();
      this.activeMarks.push({
        type: tag as Tags.B | Tags.I | Tags.ICODE,
        startPosition: pos,
      });
    } else {

      if(tag === Tags.CONTENT){
        const insertPos = this.getInsertPosition()
        this.nodeStack.push({
          type: Tags.CONTENT,
          startPosition: insertPos,
          contentPosition: insertPos
        })
        return
      }

      const node = this.buildProsemirrorNode(tag);
      this.insertAndUpdateNodeContext(node!, tag);
    }
  }

  onCloseTag(tag: Tags) {

    console.log("CLOSE TAG FOUND IS: ", tag)
    // handle marks and tags differently
    if (this.isMarkTag(tag)) {
      if (this.activeMarks.length === 0) return;
      const topTag = this.activeMarks[this.activeMarks.length - 1];
      if (topTag.type === tag) {
        this.activeMarks.pop();
      } else {
        console.error(
          `Error: Couldn't find closing ${tag} in active marks stack`
        );
        throw new Error("Error: finding matching close mark tag");
      }
      return;
    }

    const lastNode = this.nodeStack[this.nodeStack.length - 1];

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
      console.log("Parent node before is: ", parentNode)
      const insertPos = lastNode.contentPosition + 1;
      parentNode.contentPosition = insertPos;
      console.log("Parent node after is: ", parentNode)
    }
  }

  onTextContent(txt: string) {
    let textToInsert = txt;
    if (txt.length === 0) return;

    const tr = this.editorView!.state.tr;

    if (this.nodeStack.length === 0) {
      console.warn("MESSED UP. Can't Insert text without a parent node!!!");
      textToInsert = textToInsert.replace(/\n+/g, "");
      const insertPos = this.getInsertPosition();
      // tr.insertText(textToInsert, insertPos)
      this.insertTextInEditor(textToInsert, insertPos, tr);
    } else {
      if (this.nodeStack[this.nodeStack.length - 1].type !== Tags.CODE) {
        textToInsert = textToInsert.replace(/\n+/g, "");
      }
      if (textToInsert.length === 0) return;

      const insertPos = this.getInsertPosition();
      const mappedInsertPos = tr.mapping.map(insertPos);
      const endPos = mappedInsertPos + textToInsert.length;

      // tr.insertText(textToInsert, mappedInsertPos).setMeta("isStreaming", true);
      this.insertTextInEditor(textToInsert, mappedInsertPos, tr);

      const currentRendererActiveMarkTypes = new Set(
        this.activeMarks.map((m) => m.type)
      );

      const marksToAdd: Mark[] = [];
      if(!this.schema) return
      if (currentRendererActiveMarkTypes.has(Tags.B)) {
          marksToAdd.push(this.schema.marks.strong.create());
      }

      if (currentRendererActiveMarkTypes.has(Tags.I)) {
         marksToAdd.push(this.schema.marks.em.create());
      }

      if (currentRendererActiveMarkTypes.has(Tags.ICODE)) {
        try {
          console.log("WILL RENDER INLINE CODE");
          
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

    this.editorView!.dispatch(tr);
  }

  onCodeBlock(codeBlock: CodeBlockNodeType) {
    const { lang } = codeBlock;
    console.log("LANG FOUND IS: ", lang);

    const codeBlocknode = this.schema!.nodes.code_block.create({
      language: lang,
      nodeId: uuidv4(),
    });
    this.insertAndUpdateNodeContext(codeBlocknode, Tags.CODE);
  }

  closeListItem() {
    const topNode = this.nodeStack[this.nodeStack.length - 1];
    const parentNode = this.nodeStack[this.nodeStack.length - 2];

    if (topNode.type === Tags.LI) {
      // simple list
      const currentPos = topNode.contentPosition;
      const insertPos = currentPos + 1;
      parentNode.contentPosition = insertPos;

      this.nodeStack.pop();
      return;
    }

    if (topNode.type === Tags.P) {
      // complex nested listing
      const currentPos = topNode.contentPosition;
      const insertPos = currentPos + 2;

      const grandParentNode = this.nodeStack[this.nodeStack.length - 3];
      grandParentNode.contentPosition = insertPos;

      this.nodeStack.pop(); // pop the paragrah
      this.nodeStack.pop(); // pop the LI

      return;
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
        parentNode.contentPosition = insertPos + 1
      }
    } else {
      console.warn("TAG MISMATCH: ", Tags.OL);
    }
  }

  createListNodeItem(): Node{
    const pN = this.schema!.nodes.paragraph.create({nodeId: uuidv4()});
        const lN = this.schema!.nodes.list_item.create({nodeId: uuidv4()}, [pN]);
        return lN
  }

  createQuoteNode(): Node{

    const emptyPara = this.schema!.nodes.paragraph.create({nodeId: uuidv4()});
    return this.schema!.nodes.blockquote.create({nodeId: uuidv4()}, emptyPara);
  }

  buildProsemirrorNode(tag: Tags) {

    if(!this.schema) return

    switch (tag) {
      case Tags.H1:
        return this.schema.nodes.heading.create({ level: 1, nodeId: uuidv4() });
      case Tags.H2:
        return this.schema.nodes.heading.create({ level: 2, nodeId: uuidv4() });
      case Tags.H3:
        return this.schema.nodes.heading.create({ level: 3, nodeId: uuidv4() });
      case Tags.P:
        return this.schema.nodes.paragraph.create({nodeId: uuidv4()});
      case Tags.UL:
        return this.createListNode("ul");
      case Tags.OL:
        return this.createListNode("ol");
      case Tags.LI:
        return this.createListNodeItem();
      case Tags.CODE:
        return this.schema.nodes.code_block.create({ language: "bash", nodeId: uuidv4() });
      case Tags.QUOTE:
        return this.createQuoteNode()
      case Tags.CHECKBOX:
        return this.schema.nodes.checkbox_item.create({nodeId: uuidv4()});
      case Tags.ADD:
        return this.generateAdditionSuggestionContainer();
      default:
        break;
    }
  }

  generateAdditionSuggestionContainer() {
    const suggestionNode =
      this.editorView!.state.schema.nodes.addition_suggestion.create({
        id: `exp-suggestion-${Date.now()}`,
        originalNodeType: "EXPERIMENT_CONTAINER",
        originalAttrs: '{nodeId: uuidv4()}',
      });

    return suggestionNode;
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

    console.log("POSITION TO INSERTTTT IS: ", pos)

    const tr = this.editorView!.state.tr
    this.insertNodeInEditor(pos, node, tr)
    this.editorView!.dispatch(tr);

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

      if(!this.editorView) return
      if (invalidParents.includes(topNode.type)) {
        this.nodeStack.pop(); // pop the P node
        const currentPos = topNode.contentPosition;
        const startPos = currentPos + 1;
        const insertPos = currentPos + 2;

        const tr = this.editorView.state.tr;
        this.insertNodeInEditor(startPos, node, tr);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: insertPos,
        });
      } else {
        const startPos = this.getInsertPosition();

        const tr = this.editorView.state.tr;
        this.insertNodeInEditor(startPos, node, tr);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: startPos + 1,
        });
      }
    } else {
      const insertPos = this.getInsertPosition();
      const newCursorPos = insertPos + 1;

      const tr = this.editorView!.state.tr;
      this.insertNodeInEditor(insertPos, node, tr);
      this.editorView!.dispatch(tr);

      this.nodeStack.push({
        type: Tags.UL,
        startPosition: insertPos,
        contentPosition: newCursorPos,
      });
    }
  }

  handleOrderedListInsertion(node: Node) {

    if(!this.editorView) return

    if (this.nodeStack.length > 0) {
      const topNode = this.nodeStack[this.nodeStack.length - 1];
      const invalidParents = [Tags.P, Tags.CODE, Tags.ICODE];
      if (invalidParents.includes(topNode.type)) {
        this.nodeStack.pop(); // pop the P node
        const currentPos = topNode.contentPosition;
        const startPos = currentPos + 1;
        const insertPos = currentPos + 2;

        const tr = this.editorView.state.tr;
        this.insertNodeInEditor(startPos, node, tr);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: insertPos,
        });
      } else {
        const startPos = this.getInsertPosition();

        const tr = this.editorView.state.tr;
        this.insertNodeInEditor(startPos, node, tr);
        this.editorView.dispatch(tr);

        this.nodeStack.push({
          type: Tags.UL,
          startPosition: startPos,
          contentPosition: startPos + 1,
        });
      }
    } else {
      const insertPos = this.getInsertPosition();
      const newCursorPos = insertPos + 1;

      const tr = this.editorView.state.tr;
      this.insertNodeInEditor(insertPos, node, tr);
      this.editorView.dispatch(tr);

      this.nodeStack.push({
        type: Tags.UL,
        startPosition: insertPos,
        contentPosition: newCursorPos,
      });
    }
  }

  handleListItemInsertion(node: Node) {
    if(!this.editorView) return

    // if (topNode.type === Tags.UL || topNode.type === Tags.OL) {
    const insertPos = this.getInsertPosition();
    const listStartPos = insertPos;
    const afterListPos = listStartPos + 1;
    const paragraphStartPos = afterListPos;
    const afterParagraphPos = paragraphStartPos + 1;

    const tr = this.editorView.state.tr;
    this.insertNodeInEditor(insertPos, node, tr);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.LI,
      startPosition: insertPos,
      contentPosition: insertPos + 1,
    });

    this.nodeStack.push({
      type: Tags.P,
      startPosition: paragraphStartPos,
      contentPosition: afterParagraphPos,
    });
  }

  handleQuoteInsertion(node: Node) {
    if(!this.editorView) return

    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr;
    this.insertNodeInEditor(insertPos, node, tr);

    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.QUOTE,
      startPosition: insertPos,
      contentPosition: insertPos + 2,
    });
  }

  handleCheckboxItemInsertion(node: Node) {
    if(!this.editorView) return

    const insertPos = this.getInsertPosition();
    const cursorPos = insertPos + 1;

    const tr = this.editorView.state.tr;
    this.insertNodeInEditor(insertPos, node, tr);
    this.editorView.dispatch(tr);

    this.nodeStack.push({
      type: Tags.CHECKBOX,
      startPosition: insertPos,
      contentPosition: cursorPos,
    });
  }

  handleInlineCodeInsertion(node: Node) {
    if(!this.editorView) return

    const insertPos = this.getInsertPosition();

    const tr = this.editorView.state.tr;
    this.insertNodeInEditor(insertPos, node, tr);
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

  insertNodeInEditor(insertPos: number, node: Node, tr: Transaction) {
    // 1. Insert the node
    let topNode
    if(this.nodeStack.length > 0){
      topNode = this.nodeStack[this.nodeStack.length - 1]
    }
    tr.insert(insertPos, node);
    if(node.type.name === "list_item" && (topNode.type === Tags.UL || topNode.type === Tags.OL)) return
    const action = {
      type: "normal",
      nodeId: null
    }
    const metaData = { nodeId: node.attrs.nodeId, type: "addition-suggestion"}
    tr.setMeta(suggestionHighlightPluginKey, { action: action, metaData: metaData} )

    //toDo: make smart selection to bring the node into view

    // const $insertPosPlusOne = tr.doc.resolve(insertPos + 1);
    // const selection = TextSelection.near($insertPosPlusOne, 1); // Find nearest valid selection forward

    // tr.setSelection(selection);
    // tr.scrollIntoView();
  }

  insertTextInEditor(textContent: string, insertPos: number, tr: Transaction) {
    tr.insertText(textContent, insertPos);
    const selectionPos = insertPos + textContent.length;
    tr.setSelection(TextSelection.create(tr.doc, selectionPos));
    tr.scrollIntoView();
  }

  private getInsertPosition(): number {
    if (this.insertionPoint !== null) {
      const insertPos = this.insertionPoint;
      this.insertionPoint = null;
      return insertPos;
    }

    if (this.nodeStack.length === 0) {
      return this.editorView!.state.doc.content.size;
    } else {
      return this.nodeStack[this.nodeStack.length - 1].contentPosition;
    }
  }
}
