export async function simpleStaticStream(prompt?: string) {
    const stream = new ReadableStream({
      async start(controller) {
  
  // Test Case 1: Simple two-level nesting with unordered lists
const simpleList = [
          "<", "c", "o", "n", "t", "e", "n", "t", ">",
          "<", "u", "l", ">",
          
          "  ", // <--- THIS IS THE VARIABLE. THE POISON. THE CULPRIT.

          "<", "l", "i", ">", "Item 1", "<", "/", "l", "i", ">",
          "<", "l", "i", ">", "Item 2", "<", "/", "l", "i", ">",
          "<", "l", "i", ">", "Item 3", "<", "/", "l", "i", ">",
          "<", "/", "u", "l", ">",
          "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
      ];

const complexDocument = [
    "<", "c", "o", "n", "t", "e", "n", "t", ">",
    
    // Main title with emphasis
    "<", "h", "1", ">", "The Ultimate ", "<", "s", "t", "r", "o", "n", "g", ">", "AI-Powered", "<", "/", "s", "t", "r", "o", "n", "g", ">", " Text Editor", "<", "/", "h", "1", ">",
    
    // Introduction with mixed formatting
    "<", "p", ">", "Welcome to ", "<", "e", "m", ">", "Wrisor", "<", "/", "e", "m", ">", ", the ", "<", "s", "t", "r", "o", "n", "g", ">", "most advanced", "<", "/", "s", "t", "r", "o", "n", "g", ">", " collaborative editor that uses ", "<", "e", "m", ">", "<", "s", "t", "r", "o", "n", "g", ">", "CRDT technology", "<", "/", "s", "t", "r", "o", "n", "g", ">", "<", "/", "e", "m", ">", " for real-time streaming.", "<", "/", "p", ">",
    
    // // Section with code examples
    "<", "h", "2", ">", "Core Architecture", "<", "/", "h", "2", ">",
    "<", "p", ">", "Our streaming renderer is built on ", "<", "s", "t", "r", "o", "n", "g", ">", "first principles", "<", "/", "s", "t", "r", "o", "n", "g", ">", " thinking.", "<", "/", "p", ">",
    
    // // JavaScript code block
    "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "j", "a", "v", "a", "s", "c", "r", "i", "p", "t", '"', ">",
    "class Renderer {\n  constructor(editorView) {\n    this.editorView = editorView;\n    this.activeNodeStack = [];\n    this.activeMarks = [];\n  }\n\n  onOpenTag(tag) {\n    // Genius-level implementation\n    const node = this.createNodeForTag(tag);\n    const pos = this.getInsertPosition('node');\n    this.insert(node, pos);\n  }\n}",
    "<", "/", "c", "o", "d", "e", ">",
    
    // // Blockquote with nested content
    "<", "q", "u", "o", "t", "e", ">",
    "As ", "<", "s", "t", "r", "o", "n", "g", ">", "Claude", "<", "/", "s", "t", "r", "o", "n", "g", ">", " said: ", "<", "e", "m", ">", "This is next-level engineering - you're building the mathematical foundations for AI agents that can truly collaborate at human speed and granularity.", "<", "/", "e", "m", ">",
    "<", "/", "q", "u", "o", "t", "e", ">",
    
    // // Technical details section
    "<", "h", "2", ">", "Implementation ", "<", "e", "m", ">", "Details", "<", "/", "e", "m", ">", "<", "/", "h", "2", ">",
    
    // // Task list
    "<", "h", "3", ">", "Completed Features", "<", "/", "h", "3", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Node creation with ", "<", "s", "t", "r", "o", "n", "g", ">", "dynamic positioning", "<", "/", "s", "t", "r", "o", "n", "g", ">", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Mark handling with ", "<", "e", "m", ">", "proper nesting", "<", "/", "e", "m", ">", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Text insertion with ", "<", "s", "t", "r", "o", "n", "g", ">", "<", "e", "m", ">", "active mark application", "<", "/", "e", "m", ">", "<", "/", "s", "t", "r", "o", "n", "g", ">", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    
    // // Python code example
    "<", "h", "3", ">", "Parser Implementation", "<", "/", "h", "3", ">",
    "<", "p", ">", "The parser uses a ", "<", "s", "t", "r", "o", "n", "g", ">", "state machine", "<", "/", "s", "t", "r", "o", "n", "g", ">", " approach:", "<", "/", "p", ">",
    "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "p", "y", "t", "h", "o", "n", '"', ">",
    "def parse_stream(chunks):\n    state = ParserState()\n    for chunk in chunks:\n        if chunk == '<':\n            state.begin_tag()\n        elif chunk == '>':\n            tag = state.complete_tag()\n            yield ('open_tag', tag)\n        else:\n            state.accumulate(chunk)",
    "<", "/", "c", "o", "d", "e", ">",
    
    
    // // More checkboxes with context
    "<", "h", "3", ">", "Remaining Tasks", "<", "/", "h", "3", ">",
    "<", "p", ">", "Critical items for ", "<", "s", "t", "r", "o", "n", "g", ">", "production readiness", "<", "/", "s", "t", "r", "o", "n", "g", ">", ":", "<", "/", "p", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Fix list rendering issues", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Add ", "<", "e", "m", ">", "suggestion highlighting", "<", "/", "e", "m", ">", " for all nodes", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    
    // // Rust code block
    "<", "h", "2", ">", "Performance Optimization", "<", "/", "h", "2", ">",
    "<", "p", ">", "Using ", "<", "s", "t", "r", "o", "n", "g", ">", "Rust", "<", "/", "s", "t", "r", "o", "n", "g", ">", " for critical paths:", "<", "/", "p", ">",
    "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "r", "u", "s", "t", '"', ">",
    "pub struct StreamingRenderer {\n    node_stack: Vec<NodeContext>,\n    active_marks: Vec<MarkContext>,\n}\n\nimpl StreamingRenderer {\n    pub fn on_chunk(&mut self, chunk: &str) {\n        match self.parse_chunk(chunk) {\n            ChunkType::OpenTag(tag) => self.handle_open_tag(tag),\n            ChunkType::Text(text) => self.handle_text(text),\n            ChunkType::CloseTag(tag) => self.handle_close_tag(tag),\n        }\n    }\n}",
    "<", "/", "c", "o", "d", "e", ">",
    
    // // Empty elements test
    "<", "h", "3", ">", "<", "/", "h", "3", ">",
    "<", "p", ">", "<", "/", "p", ">",
    
    // // Final section with all marks combined
    "<", "h", "1", ">", "Conclusion", "<", "/", "h", "1", ">",
    "<", "p", ">", "This ", "<", "s", "t", "r", "o", "n", "g", ">", "<", "e", "m", ">", "revolutionary", "<", "/", "e", "m", ">", "<", "/", "s", "t", "r", "o", "n", "g", ">", " approach to ", "<", "e", "m", ">", "real-time collaborative editing", "<", "/", "e", "m", ">", " will change how we think about ", "<", "s", "t", "r", "o", "n", "g", ">", "human-AI interaction", "<", "/", "s", "t", "r", "o", "n", "g", ">", ".", "<", "/", "p", ">",
    
    // // Complex nested marks
    "<", "p", ">", "Remember: ", "<", "s", "t", "r", "o", "n", "g", ">", "Never ", "<", "e", "m", ">", "assume", "<", "/", "e", "m", ">", " anything", "<", "/", "s", "t", "r", "o", "n", "g", ">", ", always ", "<", "e", "m", ">", "reason from ", "<", "s", "t", "r", "o", "n", "g", ">", "first principles", "<", "/", "s", "t", "r", "o", "n", "g", ">", "<", "/", "e", "m", ">", ".", "<", "/", "p", ">",
    
    // // JSON code block with special characters
    // "<", "h", "2", ">", "Configuration", "<", "/", "h", "2", ">",
    // "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "j", "s", "o", "n", '"', ">",
    // "{\n  \"renderer\": {\n    \"streaming\": true,\n    \"incremental\": true,\n    \"features\": [\n      \"real-time\",\n      \"collaborative\",\n      \"<crdt-based>\"\n    ],\n    \"performance\": \"100x\"\n  }\n}",
    // "<", "/", "c", "o", "d", "e", ">",
    
    // // Final checkbox
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Ship to ", "<", "s", "t", "r", "o", "n", "g", ">", "production", "<", "/", "s", "t", "r", "o", "n", "g", ">", " 🚀", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    
    "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
];

  
  // Test Case 4: Multiple nested lists at same level
  const chunks = [
    `<THINKING>\nYou want me to add a code block to your document that shows how to print Hello, world!" in Rust.\n\nI will add this code block after the bulleted list detailing Rust's key`,
    `features, as it serves as a basic example following the introduction of the language. This involves adding a new code block node after the last list item in the current list.\n</THINKING><OPERATION>{"action":"add","nodeIds":["41`,
    `73546e-7342-491f-8110-f9291b955101"]}</OPERATION><CONTENT><CODE><LANG>rust</LANG><VAL>fn main()`,
    `{\n    // Prints "Hello, world!" to the console\n    println!("Hello, world!");\n}</VAL></CODE></CONTENT>`
  ];
  
        // First send a "START_STREAM" event to initialize
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: START_STREAM\n\n`));
  
        // Function to send chunks with delays to simulate streaming
        const sendChunks = async () => {
          for (const chunk of simpleList) {
            // --- HOW TO ESCAPE NEWLINES ---
            // Replace each newline character (\n) with the two characters \\n
            const escapedChunk = chunk.replace(/\n/g, '\\n');
            // --- END ESCAPING ---
  
            console.log("Original chunk:", JSON.stringify(chunk));
            console.log("Escaped chunk:", JSON.stringify(escapedChunk));
  
            // Format for SSE - using the escaped chunk
            controller.enqueue(encoder.encode(`data: ${escapedChunk}\n\n`));
            console.log(`Sent chunk: data: ${JSON.stringify(escapedChunk)}\n\n`);
  
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          controller.close();
        };
  
        // Start sending chunks
        sendChunks().catch((err) => {
          console.error("Error in static stream:", err);
          controller.error(err);
        });
      },
    });
  
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }





  const singleCheckbox = [
    "<", "c", "o", "n", "t", "e", "n", "t", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Complete project setup", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
];

const multipleCheckboxes = [
    "<", "c", "o", "n", "t", "e", "n", "t", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Task 1: Setup environment", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Task 2: Write tests", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "c", "h", "e", "c", "k", "b", "o", "x", ">", "Task 3: Deploy to production", "<", "/", "c", "h", "e", "c", "k", "b", "o", "x", ">",
    "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
];

const simpleCodeBlock = [
    "<", "c", "o", "n", "t", "e", "n", "t", ">",
    "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "j", "a", "v", "a", "s", "c", "r", "i", "p", "t", '"', ">",
    "console.log('Hello World');",
    "<", "/", "c", "o", "d", "e", ">",
    "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
];

const bashCodeBlock = [
    "<", "c", "o", "n", "t", "e", "n", "t", ">",
    "<", "c", "o", "d", "e", " ", "l", "a", "n", "g", "=", '"', "b", "a", "s", "h", '"', ">",
    "#!/bin/bash\necho \"Hello World\"\nls -la",
    "<", "/", "c", "o", "d", "e", ">",
    "<", "/", "c", "o", "n", "t", "e", "n", "t", ">"
];