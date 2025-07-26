



export interface NodeContextType {
    text: string;
    type: string;
    size: number;
    id: string;
}

export interface DocContentNodes {
    id: string;
    type: string;
    content: string;
}

export interface CursorContextType {
    currentNode: NodeContextType;
    precedingNode: NodeContextType | null;
    followingNode: NodeContextType | null;
    cursorPos: number;
    selectedText: string;
    documentContext: DocContentNodes[];
}