import { suggestionHighlightPluginKey } from "@/plugins/suggestion-highlight-plugin";
import { extendedProseMirrorSchema } from "@/providers/editor-context-provider";
import { NudeTags, ParsedTag } from "@/types/editor";
import { Mark, Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { nanoid } from "nanoid";
import { CodeBlockNodeType } from "./composer-mode-parser";

interface NodeContextType {
  type: NudeTags;
  node: Node;
  nodeId: string;
}

interface ActiveMarksType {
  type: NudeTags
  startPosition: number;
  endPosition: number;
}

function isMarkTag(tag: NudeTags) {
  return (
    tag === NudeTags.b ||
    tag === NudeTags.strong ||
    tag === NudeTags.em ||
    tag === NudeTags.icode
  );
}

export class Renderer {
  private editorView: EditorView | null = null;
  private activeNodeStack: NodeContextType[] = [];
  private activeMarks: ActiveMarksType[] = [];
  private targetPosition: number | null = null;

  constructor(editorView: EditorView) {
    this.editorView = editorView;
  }

  public setTargetPosition(position: number) {
    this.targetPosition = position;
  }

  public onOpenTag(parsedTag: ParsedTag ) {
    if (!this.editorView) return;
    console.log("open tag renderer: ", parsedTag);
    console.log("Current Tag Stack: ", this.activeNodeStack);

    const isMark = isMarkTag(parsedTag.tag);

    if (isMark) {
      const pos = this.getInsertPosition("text");
      this.activeMarks.push({
        type: parsedTag.tag,
        startPosition: pos,
        endPosition: pos,
      });
      return;
    }

    const node = this.createNode(parsedTag);
    const insertPos = this.getInsertPosition("node");

    const tr = this.editorView.state.tr;
    tr.insert(insertPos, node);
    this.applyHighlightMeta(tr, parsedTag.tag, node);

    this.activeNodeStack.push({
      type: parsedTag.tag,
      node: node,
      nodeId: node.attrs.nodeId,
    });

    this.editorView.dispatch(tr);
  }

  public onCloseTag(ParsedTag: ParsedTag) {
    if (!this.editorView) return;
    console.log("close tag renderer: ", ParsedTag.tag);
    console.log("Current Tag Stack: ", this.activeNodeStack);

    if (isMarkTag(ParsedTag.tag)) {
      const topTag = this.activeMarks[this.activeMarks.length - 1]
      if(topTag.type === ParsedTag.tag){
        this.activeMarks.pop()
        return
      } else {
        console.warn(`Expecting ${ParsedTag.tag} but found ${topTag}`)
        throw new Error("Unexpected closing tag")
      }
    }

    if (this.activeNodeStack.length === 0) {
      console.warn(`Trying to close ${ParsedTag.tag} but no nodes are open`);
      return;
    }

    const currentContext =
      this.activeNodeStack[this.activeNodeStack.length - 1];

    if (currentContext.type !== ParsedTag.tag) {
      console.warn(
        `Tag mismatch: expected ${currentContext.type}, got ${ParsedTag.tag}`
      );
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
        (parentContext.type === NudeTags.ul || parentContext.type === NudeTags.ol) &&
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

  public onCodeBlock(codeBlock: CodeBlockNodeType) {
    if (!this.editorView) return;

    const { lang, content } = codeBlock;

    const textNode = extendedProseMirrorSchema.text(content);

    const codeBlockNode = extendedProseMirrorSchema.nodes.code_block.create(
      {
        language: lang || "text",
        nodeId: nanoid(10),
      },
      textNode
    );

    const insertPos = this.getInsertPosition("node");
    const tr = this.editorView.state.tr;

    tr.insert(insertPos, codeBlockNode);
    this.applyHighlightMeta(tr, NudeTags.code, codeBlockNode);

    this.activeNodeStack.push({
      type: NudeTags.code,
      node: codeBlockNode,
      nodeId: codeBlockNode.attrs.nodeId,
    });

    this.editorView.dispatch(tr);
  }

  private getMarkTypeForTag(tag: NudeTags) {
    if (!extendedProseMirrorSchema) return null;

    switch (tag) {
      case NudeTags.strong:
        return extendedProseMirrorSchema.marks.strong;
      case NudeTags.b:
        return extendedProseMirrorSchema.marks.strong;
      case NudeTags.em:
        return extendedProseMirrorSchema.marks.em;
      default:
        return null;
    }
  }

  applyHighlightMeta(tr: Transaction, tag: NudeTags, node: Node) {
    if (this.isContainerNode(tag)) {
      const metaData = {
        metaData: {
          nodeId: node.attrs.nodeId,
          type: "addition-suggestion",
        },
      };
      tr?.setMeta(suggestionHighlightPluginKey, metaData);
    }
  }

  private isContainerNode(tag: NudeTags): boolean {
    const containerTags = [
      NudeTags.h1,
      NudeTags.h2,
      NudeTags.h3,
      NudeTags.p,
      NudeTags.ul,
      NudeTags.ol,
      NudeTags.quote,
      NudeTags.code,
      NudeTags.checkbox,
    ];

    return containerTags.includes(tag);
  }

  createListNodeItem(): Node {
    const paragraph = extendedProseMirrorSchema.nodes.paragraph.create({
      nodeId: nanoid(10),
    });

    return extendedProseMirrorSchema.nodes.list_item.create(
      { nodeId: nanoid(10) },
      paragraph
    );
  }

  createListNode(type: "ul" | "ol"): Node {
    if (type === "ol") {
      const orderedList = extendedProseMirrorSchema.nodes.ordered_list.create({
        nodeId: nanoid(10),
      });
      return orderedList;
    }

    const bulletList = extendedProseMirrorSchema.nodes.bullet_list.create({
      nodeId: nanoid(10),
    });
    return bulletList;
  }

  createQuoteNode(): Node {
    const defaultParagraph = extendedProseMirrorSchema.nodes.paragraph.create({
      nodeId: nanoid(10),
    });

    return extendedProseMirrorSchema.nodes.blockquote.create(
      { nodeId: nanoid(10) },
      defaultParagraph
    );
  }

  public getInsertPosition(type: "node" | "text"): number {

    // if we have a target position, use it
    if(this.targetPosition) {
      const posToInsert = this.targetPosition;
      this.targetPosition = null;
      return posToInsert;
    }

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

    if (parentNode.type.name === "list_item" && parentNode.firstChild) {
      const paragraphNode = parentNode.firstChild;
      const paragraphPos = parentPos + 1;

      console.log("🔍 LIST ITEM DEBUG:");
      console.log("  parentPos:", parentPos);
      console.log("  paragraphPos:", paragraphPos);
      console.log("  paragraphNode.content.size:", paragraphNode.content.size);
      console.log(
        "  calculated position:",
        paragraphPos + paragraphNode.content.size + 1
      );
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

  public createNode(parsedTag: ParsedTag): Node {
    const tag = parsedTag.tag
    switch (tag) {
      case NudeTags.h1:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 1,
          nodeId: nanoid(10),
        });
      case NudeTags.h2:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 2,
          nodeId: nanoid(10),
        });
      case NudeTags.h3:
        return extendedProseMirrorSchema.nodes.heading.create({
          level: 3,
          nodeId: nanoid(10),
        });
      case NudeTags.p:
        return extendedProseMirrorSchema.nodes.paragraph.create({
          nodeId: nanoid(10),
        });
      case NudeTags.ul:
        return this.createListNode("ul");
      case NudeTags.ol:
        return this.createListNode("ol");
      case NudeTags.li:
        return this.createListNodeItem();
      case NudeTags.code:
        return extendedProseMirrorSchema.nodes.code_block.create({
          language: parsedTag.attributes["language"],
          nodeId: nanoid(10),
        });
      case NudeTags.quote:
        return this.createQuoteNode();
      case NudeTags.checkbox:
        return extendedProseMirrorSchema.nodes.checkbox_item.create({
          nodeId: nanoid(10),
        });
      default:
        return extendedProseMirrorSchema.nodes.paragraph.create({
          nodeId: nanoid(10),
        });
    }
  }

  public cleanup() {
    this.activeNodeStack = [];
    this.activeMarks = [];
    this.targetPosition = null;
  }
}
