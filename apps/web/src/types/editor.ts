export type Action = "add" | "replace" | "delete";

export type OperationType = {
  action: Action;
  nodeIds: string[];
}


export type MODE = Tags.thinking | Tags.operation | Tags.content | Tags.normal | Tags.code;

export enum Tags {
  h1 = "h1",
  h2 = "h2", 
  h3 = "h3",
  p = "p",
  b = "b",
  strong = "strong",
  em = "em",
  i = "i",
  ul = "ul",
  ol = "ol",
  li = "li",
  code = "code",
  content = "content",
  icode = "icode",
  quote = "quote",
  add = "add",
  checkbox = "checkbox",
  node = "node",
  delete = "delete",
  operation = "operation",
  thinking = "thinking",
  normal = "normal",
}
