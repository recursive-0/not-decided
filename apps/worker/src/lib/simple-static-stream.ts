export async function simpleStaticStream(prompt?: string) {
    const stream = new ReadableStream({
      async start(controller) {
  
const dummyStreamData = [
  // 1. Thought process starts
  '{"type":"tss"}',
  '{"type":"tc","data":"Okay, I need to write a short introduction to the Rust programming language. I will start with a main heading, then a paragraph explaining its key features like safety and performance."}',
  
  // 2. Thought process ends
  '{"type":"tse"}',
  
  // 3. Action to insert the content after the element with id 'root'
  '{"type":"act","actionId":"write-rust-article","op":"insert_after","targetId":"root"}',
  
  // 4. Content stream starts, targeting the actionId from the previous step
  '{"type":"css","for_actionId":"write-rust-article"}',
  
  // 5. First content chunk: An H1 heading
  '{"type":"cc","data":"<h1>Exploring Rust: A Modern Language for Systems Programming</h1>"}',
  
  // 6. Second content chunk: An opening paragraph tag
  '{"type":"cc","data":"<p>"}',
  
  // 7. Third content chunk: The text content of the paragraph, broken up
  '{"type":"cc","data":"In the world of programming, Rust has rapidly gained prominence for its focus on safety, speed, and concurrency. "}',
  
  // 8. Fourth content chunk: More text
  '{"type":"cc","data":"Unlike languages that rely on garbage collection, Rust employs a unique ownership system to manage memory, "}',
  
  // 9. Fifth content chunk: Final part of the text
  '{"type":"cc","data":"preventing common bugs like null pointer dereferences and data races."}',
  
  // 10. Sixth content chunk: The closing paragraph tag
  '{"type":"cc","data":"</p>"}',
  
  // 11. Seventh content chunk: A new paragraph
  '{"type":"cc","data":"<p>This makes it a powerful tool for building reliable and efficient software, from operating systems to web services.</p>"}',
  
  // 12. Content stream ends
  '{"type":"cse","for_actionId":"write-rust-article"}',

  // 13. A final message indicating the entire operation is done.
  '[DONE]'
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