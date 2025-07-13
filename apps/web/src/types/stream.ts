import { Node } from "prosemirror-model";



export enum TypeEnum {
    insert = "insert",
    delete = "delete",
}


export interface ActionMessageType {
    type: TypeEnum,
    targetId: string,
    pos: "before" | "after",
}

export enum OperationType {
    replace = "replace",
    delete = "delete",
    insert_after = "insert_after",
    insert_before = "insert_before"
}


export enum Mode {
    normal = "normal",
    thought = "thought",
    operation = "operation",
    content = "content"
}

export interface NodeContext {
    node: Node;
    insertPos: number;
}
