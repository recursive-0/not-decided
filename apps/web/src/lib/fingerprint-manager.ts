import type { Fragment, Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

export class FingerprintManager {
  private editorView: EditorView | null = null;
  private nodeFingerprints: Map<string, Node> = new Map();
  private hashCollisionCounter: Map<string, number> = new Map();

  constructor(editor: EditorView) {
    this.editorView = editor;
  }

  public clearNodeFingerprints(){
    this.nodeFingerprints = new Map()
  }

  public clearHashCollisionCounter(){
    this.hashCollisionCounter = new Map()
  }

  public fastHash(stringifiedNode: string): string {
    let hash = 0;
    for (let i = 0; i < stringifiedNode.length; i++) {
      const char = stringifiedNode.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  public getUniqueHash(content: string): string {
    // Get the base hash
    const baseHash = this.fastHash(content);

    // Check if this hash exists already
    if (this.hashCollisionCounter.has(baseHash)) {
      // Increment the counter for this hash
      const count = this.hashCollisionCounter.get(baseHash)! + 1;
      this.hashCollisionCounter.set(baseHash, count);
      // Return a unique hash with the counter appended
      return `${baseHash}_${count}`;
    } else {
      // First occurrence of this hash
      this.hashCollisionCounter.set(baseHash, 0);
      return baseHash;
    }
  }

  normalizeNodeTextContent(node: Node) {
    const textContent = node.textContent;
    const normalizedTextContent = textContent.trim().toLowerCase().normalize();
    return normalizedTextContent;
  }

  generateEditorNodesFingerprints(editor: EditorView) {
    // Reset the collision counter when regenerating all fingerprints
    this.hashCollisionCounter = new Map();
    this.nodeFingerprints = new Map();

    const editorNodes = editor.state.doc.content;

    editorNodes.content.forEach((node: Node, index) => {
      const normalizedContent = this.normalizeNodeTextContent(node);
      const uniqueHash = this.getUniqueHash(normalizedContent);
      console.log("HASH IS: ", uniqueHash);
      this.nodeFingerprints.set(uniqueHash, node);
    });
  }

  matchFingerprint(
    hash: string
  ): { node: Node; insertPosition: number; startPos: number } | null {
    console.log("NODE TO MATCH: ", hash);
    console.log("CURRENT HASHES IN EDITOR", this.nodeFingerprints);

    const matchedNode = this.nodeFingerprints.get(hash);
    if (!matchedNode || matchedNode.type.name === "deletion_suggestion") return null;

    // This gives us node's start position in the document
    const pos = this.findNodePosition(matchedNode);

    // To insert after the node, we need pos + node.nodeSize
    const insertionPosition = pos + matchedNode.nodeSize;

    return {
      node: matchedNode,
      insertPosition: insertionPosition,
      startPos: pos,
    };
  }

  private findNodePosition(targetNode: Node): number {
    let foundPos = -1;

    this.editorView.state.doc.descendants((node, pos) => {
      if (node === targetNode) {
        foundPos = pos;
        return false; // Stop traversal
      }
    });

    return foundPos;
  }
}
