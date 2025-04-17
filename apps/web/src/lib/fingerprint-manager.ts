import type { Fragment, Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";




export class FingerprintManager{
    private editorView: EditorView | null = null
    private nodeFingerprints: Map<string, Node> = new Map()

    constructor(editor: EditorView){
        this.editorView = editor
    }


    public fastHash(stringifiedNode: string): string {
        let hash = 0;
        for (let i = 0; i < stringifiedNode.length; i++) {
            const char = stringifiedNode.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; 
        }
        return hash.toString(16);
    }

    normalizeNodeTextContent(node: Node){

        const textContent = node.textContent
        const normalizedTexContent = textContent.trim().toLowerCase().normalize()

        return normalizedTexContent

    }

    generateEditorNodesFingerprints(editor: EditorView){
        const editorNodes = editor.state.doc.content

        editorNodes.forEach((node: Node) => {
            const hash = this.fastHash(this.normalizeNodeTextContent(node))
            console.log("HASH IS: ", hash)
            this.nodeFingerprints.set(hash, node)

        })
    }

    matchFingerprint(hash: string): { node: Node, position: number, startPos: number } | null {
        const matchedNode = this.nodeFingerprints.get(hash)
        if (!matchedNode) return null

        // This gives us node's start position in the document
        const pos = this.findNodePosition(matchedNode)
        
        // To insert after the node, we need pos + node.nodeSize
        const insertionPosition = pos + matchedNode.nodeSize

        return {
            node: matchedNode,
            position: insertionPosition,
            startPos: pos,
        }
    }

    private findNodePosition(targetNode: Node): number {
        let foundPos = -1
        
        this.editorView.state.doc.descendants((node, pos) => {
            if (node === targetNode) {
                foundPos = pos
                return false // Stop traversal
            }
        })
        
        return foundPos
    }

}