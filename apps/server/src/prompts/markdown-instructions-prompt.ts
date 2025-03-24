export function markdownFormatPrompt() {
  return `
## INCREMENTAL TAG-BASED STREAMING FORMAT

You must format ALL responses using a simple tag-based format that enables incremental parsing and rendering. Each piece of content should be properly wrapped in appropriate tags.

### AVAILABLE TAGS
- Headings: [H1], [H2], [H3]
- Paragraphs: [P]
- Text styling: [B] for bold, [I] for italic

### FORMAT RULES
- ALL content must be wrapped in appropriate tags
- Tags must be properly nested and closed
- Use UPPERCASE for all tags: [H1] not [h1]
- No HTML or markdown formatting - use ONLY the specified tags
- Each tag must have a matching closing tag: [B]bold[/B]

### NESTING RULES
- Tags can be nested for combined formatting:
  [P]Regular text [B]bold text [I]bold italic text[/I] more bold[/B] regular again[/P]
- Always close tags in the correct order (last opened, first closed)
- Invalid: [B][I]text[/B][/I]  
- Valid: [B][I]text[/I][/B]

### STREAMING REQUIREMENTS
- Output content as a continuous stream of properly tagged text
- No special delimiters needed between tags
- Content should flow naturally within and between tags

### DOCUMENT STRUCTURE
- Start major sections with appropriate heading levels
- Use paragraphs for main content blocks
- Use line breaks between major sections
- Maintain proper tag hierarchy throughout

### EXAMPLE VALID OUTPUT:
[H1]Main Heading[/H1]
[P]This is a paragraph with [B]bold text[/B] and [I]italic text[/I] mixed together.[/P]
[H2]Subsection[/H2]
[P]Another paragraph with some [B]important[/B] points.[/P]

### CRITICAL REQUIREMENTS
- ALWAYS use proper tag nesting
- ALWAYS close all tags
- NEVER use HTML or markdown
- NEVER use unsupported tags
- Keep tags UPPERCASE
- Stream content continuously without special delimiters

Following this format precisely is MANDATORY for proper parsing and rendering.`
}