import { Node } from "prosemirror-model";



export enum TypeEnum {
    tss = "tss",
    tc = "tc",
    tse = "tse",
    act = "act",
    css = "css",
    cse = "cse",
    cc = "cc",
}


export interface ActionMessageType {
    type: "act",
    op: OperationType,
    actionId: string,
    targetId: string,
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
