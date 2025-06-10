import { Transaction } from "prosemirror-state";
import { Tags } from "@/types/editor";
import { Mark, Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { extendedProseMirrorSchema } from "@/providers/editor-context-provider";
import { v4 as uuidv4 } from "uuid";
import { suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { CodeBlockNodeType } from "./composer-mode-parser";

interface NodeContextType {
  type: Tags;
  node: Node;
  nodeId: string;
}

interface ActiveMarksType {
  type: Tags.b | Tags.em | Tags.strong | Tags.icode
  startPosition: number;
  endPosition: number;
}

function isMarkTag(tag: Tags) {
  return tag === Tags.b || tag === Tags.strong || tag === Tags.em || tag === Tags.icode
}

export class Renderer {
  private editorView: EditorView | null = null;
  private activeNodeStack: NodeContextType[] = [];
  private activeMarks: ActiveMarksType[] = [];
  private insertionPoint: number | null = null;

  constructor(editorView: EditorView) {
    this.editorView = editorView;
  }

  public cleanupAfterStreamStop() {
    if (
      this.activeNodeStack.length > 0 &&
      this.activeNodeStack[this.activeNodeStack.length - 1].type === Tags.add
    ) {
      this.activeNodeStack = [];
      this.activeMarks = [];
    }
  }

  public setInsertionPoint(targetedPos: number) {
    this.insertionPoint = targetedPos;
  }

  public onOpenTag(tag: Tags) {
    if (!this.editorView) return;
    console.log("Incoming open tag: ", tag);
    console.log("Current Tag Stack: ", this.activeNodeStack);

    const isMark = isMarkTag(tag);

    if (isMark) {
      const pos = this.getInsertPosition("text");
      this.activeMarks.push({
        type: tag,
        startPosition: pos,
        endPosition: pos,
      });
      return;
    }

    console.log("Creating NODE for: ", tag);
    const node = this.createNodeForTag(tag);
    const insertPos = this.getInsertPosition("node");

    const tr = this.editorView.state.tr;
    tr.insert(insertPos, node);

    this.activeNodeStack.push({
      type: tag,
      node: node,
      nodeId: node.attrs.nodeId,
    });

    this.editorView.dispatch(tr);
  }

  public onCloseTag(tag: Tags) {
    if (!this.editorView) return;
    console.log("Incoming close tag: ", tag);
    console.log("Current Tag Stack: ", this.activeNodeStack);

    if (isMarkTag(tag)) {
      this.closeActiveMark(tag);
      return;
    }

    if (this.activeNodeStack.length === 0) {
      console.warn(`Trying to close ${tag} but no nodes are open`);
      return;
    }

    const currentContext =
      this.activeNodeStack[this.activeNodeStack.length - 1];

    if (currentContext.type !== tag) {
      console.warn(`Tag mismatch: expected ${currentContext.type}, got ${tag}`);
      return;
    }

    this.activeNodeStack.pop();
  }

  public onTextContent(text: string) {
    if (!this.editorView) return;

     if (this.activeNodeStack.length > 0) {
    const parentContext =
      this.activeNodeStack[this.activeNodeStack.length - 1];

    // If the direct parent is a list container (ul or ol) AND the incoming text
    // consists of nothing but whitespace characters...
    if (
      (parentContext.type === Tags.ul || parentContext.type === Tags.ol) &&
      text.trim().length === 0
    ) {
      // ...then this is insignificant layout noise from the LLM.
      // Discard it and stop processing immediately.
      return; 
    }
  }

    const insertPos = this.getInsertPosition("text");
    const tr = this.editorView.state.tr;

    const activePMarks = this.activeMarks
      .map((m) => {
        const markType = this.getMarkTypeForTag(m.type);

        return markType ? markType.create() : null;
      })
      .filter((m): m is Mark => m !== null);

    const textNode = extendedProseMirrorSchema.text(text, activePMarks);

    tr.insert(insertPos, textNode);

    this.updateActiveMarkEndPositions(text.length);

    this.editorView.dispatch(tr);
  }

  private updateActiveMarkEndPositions(textLength: number) {
    this.activeMarks.forEach((mark) => {
      mark.endPosition += textLength;
    });
  }

  private closeActiveMark(tag: Tags) {
    const markIndex = this.activeMarks.findLastIndex(
      (mark) => mark.type === tag
    );

    if (markIndex === -1) {
      console.warn(`No active ${tag} mark to close`);
      return;
    }

    this.activeMarks.splice(markIndex, 1);
  }

  public onCodeBlock(codeBlock: CodeBlockNodeType) {
    if (!this.editorView) return;

    const { lang, content } = codeBlock;

    const textNode = extendedProseMirrorSchema.text(content);

    const codeBlockNode = extendedProseMirrorSchema.nodes.code_block.create(
      {
        language: lang || "text",
        nodeId: uuidv4(),
      },
      textNode
    );

    const insertPos = this.getInsertPosition("node");
    const tr = this.editorView.state.tr;

    tr.insert(insertPos, codeBlockNode);
    this.applyHighlightMeta(tr, Tags.code, codeBlockNode);

    this.activeNodeStack.push({
      type: Tags.code,
      node: codeBlockNode,
      nodeId: codeBlockNode.attrs.nodeId,
    });

    this.editorView.dispatch(tr);
  }

  private getMarkTypeForTag(tag: Tags) {
    if (!extendedProseMirrorSchema) return null;

    switch (tag) {
      case Tags.strong:
        return extendedProseMirrorSchema.marks.strong;
      case Tags.b:
        return extendedProseMirrorSchema.marks.strong;
      case Tags.em:
        return extendedProseMirrorSchema.marks.em;
      default:
        return null;
    }
  }

  applyHighlightMeta(tr: Transaction, tag: Tags, node: Node) {
    if (this.isContainerNode(tag)) {
      const metaData = {
        nodeId: node.attrs.nodeId,
        type: "addition-suggestion",
      };
      tr?.setMeta(suggestionHighlightPluginKey, { metaData: metaData });
    }
  }

  private isContainerNode(tag: Tags): boolean {
    const containerTags = [
      Tags.h1,
      Tags.h2,
      Tags.h3,
      Tags.p,
      Tags.ul,
      Tags.ol,
      Tags.quote,
      Tags.code,
      Tags.checkbox,
    ];

    return containerTags.includes(tag);
  }

  createListNodeItem(): Node {
    const paragraph = extendedProseMirrorSchema.nodes.paragraph.create({
      nodeId: uuidv4(),
    });

    return extendedProseMirrorSchema.nodes.list_item.create(
      { nodeId: uuidv4() },
      paragraph
    );
  }

  createListNode(type: "ul" | "ol"): Node {
    if (type === "ol") {
      const orderedList = extendedProseMirrorSchema.nodes.ordered_list.create({
        nodeId: uuidv4(),
      });
      return orderedList;
    }

    const bulletList = extendedProseMirrorSchema.nodes.bullet_list.create({
      nodeId: uuidv4(),
    });
    return bulletList;
  }

  createQuoteNode(): Node {
    const defaultParagraph = extendedProseMirrorSchema.nodes.paragraph.create({
      nodeId: uuidv4(),
    });

    return extendedProseMirrorSchema.nodes.blockquote.create(
      { nodeId: uuidv4() },
      defaultParagraph
    );
  }

  public getInsertPosition(type: "node" | "text"): number {
    if (this.activeNodeStack.length === 0) {
      return this.editorView?.state.doc.content.size || 0;
    }

    if (type === "node") {
      const parentContext =
        this.activeNodeStack[this.activeNodeStack.length - 1];
      return this.calculateInnerPosition(parentContext.nodeId);
    }

    if (type === "text") {
      const parentContext =
        this.activeNodeStack[this.activeNodeStack.length - 1];
      return this.calculateTextAppendPosition(parentContext.nodeId);
    }

    return this.editorView?.state.doc.content.size || 0;
  }

private calculateInnerPosition(parentNodeId: string): number {
    const parentPos = this.findCurrentNodePosition(parentNodeId);
    // Find the actual node in the document
    const parentNode = this.findNodeByIdInDocument(parentNodeId);

    if (!parentNode) {
      // Fallback or error, though this should not happen in the stream
      return parentPos + 1;
    }

    // THIS IS THE FIX:
    // Go to the start of the parent node, step inside (+1),
    // and then move past all the content that's already there.
    return parentPos + 1 + parentNode.content.size;
}

  private findCurrentNodePosition(nodeId: string): number {
    let position = 0;
    let found = false;

    this.editorView?.state.doc.descendants((node, pos) => {
      if (node.attrs?.nodeId === nodeId) {
        position = pos;
        found = true;
        return false;
      }
    });

    if (!found) throw new Error(`Node ${nodeId} not found`);
    return position;
  }

  private calculateTextAppendPosition(parentNodeId: string): number {
    const parentPos = this.findCurrentNodePosition(parentNodeId);
    console.log("Parent position is: ", parentPos);
    const parentNode = this.findNodeByIdInDocument(parentNodeId);
    console.log("Text position is: ", parentPos + parentNode.content.size);

    if (parentNode.type.name === "blockquote" && parentNode.firstChild) {
      const paragraphNode = parentNode.firstChild;
      const paragraphPos = parentPos + 1;
      return paragraphPos + paragraphNode.content.size + 1;
    }

if(parentNode.type.name === "list_item" && parentNode.firstChild){
  const paragraphNode = parentNode.firstChild;
  const paragraphPos = parentPos + 1;
  
  console.log("🔍 LIST ITEM DEBUG:");
  console.log("  parentPos:", parentPos);
  console.log("  paragraphPos:", paragraphPos);
  console.log("  paragraphNode.content.size:", paragraphNode.content.size);
  console.log("  calculated position:", paragraphPos + paragraphNode.content.size + 1);
  console.log("  paragraphNode.type.name:", paragraphNode.type.name);
  console.log("  paragraphNode content:", paragraphNode.textContent);
  
  return paragraphPos + paragraphNode.content.size + 1;
}

    return parentPos + parentNode.content.size + 1;
  }

  private findNodeByIdInDocument(nodeId: string): Node {
    let targetNode: Node | null = null;

    this.editorView?.state.doc.descendants((node) => {
      if (node.attrs?.nodeId === nodeId) {
        targetNode = node;
        return false;
      }
    });

    if (!targetNode) throw new Error(`Node ${nodeId} not found`);
    return targetNode;
  }

  public createNodeForTag(tag: Tags): Node {
    switch (tag) {
      case Tags.h1:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 1,
          nodeId: uuidv4(),
        });
      case Tags.h2:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 2,
          nodeId: uuidv4(),
        });
      case Tags.h3:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 3,
          nodeId: uuidv4(),
        });
      case Tags.p:
        return extendedProseMirrorSchema.nodes.paragraph.create({
          nodeId: uuidv4(),
        });
      case Tags.ul:
        return this.createListNode("ul");
      case Tags.ol:
        return this.createListNode("ol");
      case Tags.li:
        return this.createListNodeItem();
      case Tags.code:
        return extendedProseMirrorSchema.nodes.code_block.create({
          language: "bash",
          nodeId: uuidv4(),
        });
      case Tags.quote:
        return this.createQuoteNode();
      case Tags.checkbox:
        return extendedProseMirrorSchema.nodes.checkbox_item.create({
          nodeId: uuidv4(),
        });
      default:
        return extendedProseMirrorSchema.nodes.paragraph.create({
          nodeId: uuidv4(),
        });
    }
  }
}
