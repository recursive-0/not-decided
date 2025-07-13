export type Action = {
  type: "insert" | "delete";
  targetId: string;
  pos: "before" | "after";
}

export type MODE = Tags.thinking | Tags.content | Tags.normal | Tags.action;

export enum Tags {
  h1 = "<h1>",
  
  h2 = "<h2>", 
  h3 = "<h3>",
  p = "<p>",
  b = "<b>",
  strong = "<strong>",
  em = "<em>",
  i = "<i>",
  ul = "<ul>",
  ol = "<ol>",
  li = "<li>",
  code = "<code>",
  icode = "<icode>",
  quote = "<quote>",
  checkbox = "<checkbox>",
  normal = "<normal>",
  thinking = "<TKH>",
  action = "<ACT>",
  content = "<CNT>",
}

