export function markdownFormatPrompt() {
  return `
## PROSEMIRROR JSON NODE STREAMING FORMAT

You must format ALL responses as a stream of individual ProseMirror JSON nodes with explicit delimiters. This format enables incremental document rendering in real-time without complex parsing.

### NODE DELIMITER FORMAT
- Each node MUST be wrapped with <> and </> tags
- Each node MUST contain valid JSON for a ProseMirror node structure
- Example: <>{"type":"paragraph","content":[{"type":"text","text":"Content here"}]}</>

### DOCUMENT STRUCTURE
- Start with a doc type node ONLY if beginning a completely new document
- All content nodes must be valid according to ProseMirror schema
- Never leave nodes incomplete or improperly structured
- Ensure each node is a complete, self-contained unit that can render independently

### NODE TYPES AND STRUCTURE

#### Text Nodes
- Basic text: <>{"type":"text","text":"Plain text content"}</>
- Bold text: <>{"type":"text","marks":[{"type":"strong"}],"text":"Bold text"}</>
- Italic text: <>{"type":"text","marks":[{"type":"em"}],"text":"Italic text"}</>
- Code text: <>{"type":"text","marks":[{"type":"code"}],"text":"inline code"}</>

#### Block Nodes
- Paragraph: 
  <>{"type":"paragraph","content":[{"type":"text","text":"Paragraph text"}]}</>

- Heading (level 1-3): 
  <>{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Heading text"}]}</>

- Bullet List:
  <>{"type":"bullet_list","content":[
    {"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"First item"}]}]},
    {"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"Second item"}]}]}
  ]}</>

- Ordered List:
  <>{"type":"ordered_list","content":[
    {"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"First item"}]}]},
    {"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"Second item"}]}]}
  ]}</>

- Code Block:
  <>{"type":"code_block","attrs":{"language":"javascript"},"content":[{"type":"text","text":"function example() {\\n  return true;\\n}"}]}</>

- Blockquote:
  <>{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Quote text"}]}]}</>

### CRITICAL REQUIREMENTS
- Each JSON node MUST be completely valid - no malformed JSON
- Never use markdown formatting - use ONLY the ProseMirror JSON structure
- Always close all nodes properly with matching start/end delimiters
- Ensure proper nesting of content arrays when a node contains child nodes
- DO NOT output partial nodes or incomplete JSON structures
- Output one complete node at a time, properly delimited
- For complex document structures, output multiple individual nodes sequentially

### EXAMPLE VALID OUTPUT
To render a heading followed by a paragraph:

<>{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Introduction"}]}</>
<>{"type":"paragraph","content":[{"type":"text","text":"This is the first paragraph with "},{"type":"text","marks":[{"type":"strong"}],"text":"bold text"},{"type":"text","text":" inside it."}]}</>

### NODE COMPOSABILITY
- For complex formatting like a paragraph with mixed formatting:
  <>{"type":"paragraph","content":[
    {"type":"text","text":"This has "},
    {"type":"text","marks":[{"type":"strong"}],"text":"bold"},
    {"type":"text","text":" and "},
    {"type":"text","marks":[{"type":"em"}],"text":"italic"},
    {"type":"text","text":" formatting."}
  ]}</>

This precise format is MANDATORY for proper incremental rendering. Follow these guidelines exactly for optimal integration with the ProseMirror editor.
`
}