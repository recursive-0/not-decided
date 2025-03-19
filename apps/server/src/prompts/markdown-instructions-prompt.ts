export function markdownFormatPrompt() {
  return `
## PROSEMIRROR JSON NODE STREAMING FORMAT

You must format ALL responses as a continuous stream of individual ProseMirror JSON nodes with explicit delimiters, with absolutely NO characters between nodes. This format enables incremental document rendering in real-time.

### NODE DELIMITER FORMAT
- Each node MUST be wrapped with <> and </> tags
- Nodes MUST be placed directly adjacent to each other with NO characters between them
- CRITICAL: There must be NOTHING between the closing </> of one node and the opening <> of the next
- NO newlines, NO spaces, NO special characters between nodes
- Example of correct format: <>{"type":"paragraph","content":[{"type":"text","text":"First paragraph"}]}</><>{"type":"paragraph","content":[{"type":"text","text":"Second paragraph"}]}</>

### DOCUMENT STRUCTURE
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
- Paragraph: <>{"type":"paragraph","content":[{"type":"text","text":"Paragraph text"}]}</>
- Heading (level 1-3): <>{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Heading text"}]}</>
- Bullet List: <>{"type":"bullet_list","content":[{"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"First item"}]}]},{"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"Second item"}]}]}]}</>
- Ordered List: <>{"type":"ordered_list","content":[{"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"First item"}]}]},{"type":"list_item","content":[{"type":"paragraph","content":[{"type":"text","text":"Second item"}]}]}]}</>
- Code Block: <>{"type":"code_block","attrs":{"language":"javascript"},"content":[{"type":"text","text":"function example() {\\\\n  return true;\\\\n}"}]}</>
- Blockquote: <>{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Quote text"}]}]}</>

### STREAMING REQUIREMENTS
- Output nodes as a continuous stream: <>node1</><>node2</><>node3</>
- NEVER insert ANY characters between nodes (no spaces, no newlines, nothing)
- NEVER include formatting whitespace within the JSON
- For newlines within text content, escape them as "\\\\n" NOT actual newlines

### CRITICAL REQUIREMENTS
- Each JSON node MUST be completely valid - no malformed JSON
- Never use markdown formatting - use ONLY the ProseMirror JSON structure
- Always close all nodes properly with matching start/end delimiters
- Ensure proper nesting of content arrays when a node contains child nodes
- DO NOT output partial nodes or incomplete JSON structures
- Output one complete node at a time, properly delimited
- NEVER insert line breaks or whitespace between nodes
- Deliver as a continuous character stream

### EXAMPLE VALID OUTPUT (entire output should look exactly like this):
<>{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Introduction"}]}</><>{"type":"paragraph","content":[{"type":"text","text":"This is the first paragraph with "},{"type":"text","marks":[{"type":"strong"}],"text":"bold text"},{"type":"text","text":" inside it."}]}</><>{"type":"paragraph","content":[{"type":"text","text":"Another paragraph immediately following with no characters between them."}]}</>

Following this format precisely is MANDATORY for proper parsing. Any deviation will cause rendering failures.`
}