export async function simpleStaticStream(prompt?: string) {
    const stream = new ReadableStream({
      async start(controller) {
  
const dummyStreamData = [
  '<TKH>I\'ll write about React hooks and demonstrate proper inline code formatting for JavaScript concepts.</TKH>',
  '<ACT>{"type":"insert","targetId":"document-root","pos":"after"}</ACT>',
  '<CNT><h2>Understanding React Hooks</h2>',
  '<p>React hooks like ',
  '<icode>useState</icode>',
  ' and ',
  '<icode>useEffect</icode>',
  ' revolutionized how we write functional components. The ',
  '<icode>useState</icode>',
  ' hook allows you to add state to functional components, while ',
  '<icode>useEffect</icode>',
  ' handles side effects and lifecycle events.</p>',
  '<p>When importing hooks, you typically use ',
  '<icode>import { useState, useEffect } from \'react\'</icode>',
  ' at the top of your component file. You can then call ',
  '<icode>useState(initialValue)</icode>',
  ' to create state variables and ',
  '<icode>useEffect(() => {}, [])</icode>',
  ' to run effects.</p>',
  '<p>The dependency array in ',
  '<icode>useEffect</icode>',
  ' is crucial - an empty array ',
  '<icode>[]</icode>',
  ' means the effect runs once, while ',
  '<icode>[count, name]</icode>',
  ' means it runs when ',
  '<icode>count</icode>',
  ' or ',
  '<icode>name</icode>',
  ' changes.</p></CNT>'
];
  
        // First send a "START_STREAM" event to initialize
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: START_STREAM\n\n`));
  
        // Function to send chunks with delays to simulate streaming
        const sendChunks = async () => {
          for (const chunk of dummyStreamData) {
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