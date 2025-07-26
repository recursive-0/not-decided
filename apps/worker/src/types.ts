



export interface NodeContextType {
    text: string;
    type: string;
    size: number;
    id: string;
}

export interface CursorContextType {
    currentNode: NodeContextType;
    precedingNode: NodeContextType;
    followingNode: NodeContextType;
    cursorPos: number;
    selectedText: string;
    documentContext: string;
}