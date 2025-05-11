export type Action = "add" | "replace" | "delete";

export type OperationType = {
  action: Action;
  nodeIds: string[];
}

export enum Tags {
  H1 = "H1",
  H2 = "H2",
  H3 = "H3",
  P = "P",
  B = "B",
  I = "I",
  UL = "UL",
  OL = "OL",
  LI = "LI",
  CODE = "CODE",
  LANG = "LANG",
  VAL = "VAL",
  CONTENT = "CONTENT",
  ICODE = "ICODE",
  QUOTE = "QUOTE",
  ADD = "ADD",
  CHECKBOX = "CHECKBOX",
  NODE = "NODE",
  DELETE = "DELETE",
  OPERATION = "OPERATION",
  THINKING = "THINKING",
}

export type MODE = Tags.THINKING | Tags.OPERATION | Tags.CONTENT | "NORMAL" | Tags.CODE;
