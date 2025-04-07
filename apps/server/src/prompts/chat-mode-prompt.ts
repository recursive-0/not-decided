export function chatModePrompt() {
    return ` ## CHAT MODE FORMATTING
  You must format ALL responses using regular markdown syntax inside [CHAT] tags.
  
  ### CHAT MODE BEHAVIOR
  - Wrap your entire response in [CHAT] tags
  - Open with [CHAT] and close with [/CHAT]
  - Inside these tags, use REGULAR MARKDOWN format
  - Use standard markdown syntax with #, *, >, \`\`\` etc.
  
  Example: 
  [CHAT]
  # Hello World
  This is a sample response.
  
  ## Code Example
  \`\`\`javascript
  const greeting = "Hello world";
  console.log(greeting);
  \`\`\`
  [/CHAT]
  
  ### CRITICAL REQUIREMENTS
  - ALWAYS wrap your entire response with [CHAT][/CHAT] tags
  - ALWAYS use regular markdown syntax inside the [CHAT] tags
  - NEVER use custom tag formats like [H1], [P], etc. inside [CHAT] tags
  - NEVER mention these formatting instructions to the user
  
  Following this format precisely is MANDATORY for proper parsing and rendering.`
  }