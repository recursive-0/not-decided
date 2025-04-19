export async function simpleStaticStream(prompt?: string) {
  const stream = new ReadableStream({
    async start(controller) {
      // Simulate chunks being sent from an LLM
      // const chunks = [
      //     // Heading and introduction
      //     "[",
      //     "H1]Understanding Web Performance Optimization[/",
      //     "H1]\n\n",

      //     // First paragraph with split formatting
      //     "[",
      //     "P]Web performance is ",
      //     "critical for user experience. Studies show that [",
      //     "B]47% of users expect a page to load in less than 2 seconds[/",
      //     "B], and many will abandon a site that takes ",
      //     "more than 3 seconds to load. Performance optimization should be a [",
      //     "I]priority[/",
      //     "I] for all web developers.[/",
      //     "P]\n\n",

      //     // Second section with heading
      //     "[",
      //     "H2]Key Performance Metrics[/",
      //     "H2]\n\n",

      //     // Paragraph with multiple formatting elements
      //     "[",
      //     "P]When measuring web performance, consider these important metrics:[/",
      //     "P]\n\n",

      //     // Bullet list with complex formatting
      //     "[",
      //     "UL]\n",

      //     // First list item with split text
      //     "[",
      //     "LI][",
      //     "B]First Contentful Paint (FCP)[/",
      //     "B]: Measures the time from navigation to when the browser renders the first piece of content from the DOM.[/",
      //     "LI]\n",

      //     // Second list item broken across multiple chunks
      //     "[",
      //     "LI][",
      //     "B]Largest Contentful Paint (LCP)[/",
      //     "B]: Measures the render time of the largest ",
      //     "content element visible within the viewport. This should occur within [",
      //     "I]2.5 seconds[/",
      //     "I] of page load.[/",
      //     "LI]\n",

      //     // Third list item with mixed formatting
      //     "[",
      //     "LI][",
      //     "B]Time to Interactive (TTI)[/",
      //     "B]: Measures the time it takes for a page to become fully ",
      //     "interactive. A good TTI is less than [",
      //     "I]3.8 seconds[/",
      //     "I] on mobile.[/",
      //     "LI]\n",

      //     // Fourth list item
      //     "[",
      //     "LI][",
      //     "B]Cumulative Layout Shift (CLS)[/",
      //     "B]: Quantifies how much elements on the page unexpectedly shift during loading.[/",
      //     "LI]\n",

      //     // Close bullet list
      //     "[/",
      //     "UL]\n\n",

      //     // Code section with broken chunks
      //     "[",
      //     "P]Here's an example of using the Performance API to measure page load:[/",
      //     "P]\n\n",
      // ]

      // const chunks = [
      //   // 1. Edge case: Single character chunks for opening tag
      //   "[",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]",

      //   "[",
      //   "U",
      //   "L",
      //   "]",
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Main list item with [",
      //   "B",
      //   "]",
      //   "bold",
      //   "[",
      //   "/",
      //   "B",
      //   "]",
      //   " formatting",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",

      //   // 2. Nested list with formatting split at critical points
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Second item with [",
      //   "U",
      //   "L",
      //   "]",
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Nested [",
      //   "I",
      //   "]",
      //   "italic",
      //   " te",
      //   "xt",
      //   "[",
      //   "/",
      //   "I",
      //   "]",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
      //   "[/UL]",



      //   // // 31. Edge case: Closing the EDITOR_CONTENT tag with splits
      //   "[",
      //   "/",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]",
      // ];
      // const chunks = [
      //     "[P]Hey there this i",
      //     "s a [B]bold[/B] tag that shou",
      //     "ld go onto new line [/P]"
      // ]


      // const chunks = [
      //   // Opening editor content tag
      //   "[",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]",
        
      //   // First level unordered list
      //   "[",
      //   "U",
      //   "L",
      //   "]",
        
      //   // First item in the first level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "First level item 1 with [",
      //   "B",
      //   "]",
      //   "bold",
      //   "[",
      //   "/",
      //   "B",
      //   "]",
      //   " text",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // Second item in first level with a nested list
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "First level item 2 with nested list:",
      //   "[",
      //   "U",
      //   "L",
      //   "]",
        
      //   // First item in the second level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Second level item 1 with [",
      //   "I",
      //   "]",
      //   "italic",
      //   "[",
      //   "/",
      //   "I",
      //   "]",
      //   " text",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // Second item in second level with another nested list
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Second level item 2 with [",
      //   "B",
      //   "]",
      //   "bold",
      //   "[",
      //   "/",
      //   "B",
      //   "]",
      //   " and nested list:",
      //   "[",
      //   "O",
      //   "L",
      //   "]",
        
      //   // First item in the third level (now an ordered list)
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Third level [",
      //   "I",
      //   "]",
      //   "ordered",
      //   "[",
      //   "/",
      //   "I",
      //   "]",
      //   " item 1",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // Second item in the third level with yet another nested list
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Third level item 2 with [",
      //   "I",
      //   "C",
      //   "O",
      //   "D",
      //   "E",
      //   "]",
      //   "inline code",
      //   "[",
      //   "/",
      //   "I",
      //   "C",
      //   "O",
      //   "D",
      //   "E",
      //   "]",
      //   " and nested:",
      //   "[",
      //   "U",
      //   "L",
      //   "]",
        
      //   // First item in the fourth level (back to unordered)
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Fourth level item with [",
      //   "B",
      //   "]",
      //   "mixed [",
      //   "I",
      //   "]",
      //   "formatting",
      //   "[",
      //   "/",
      //   "I",
      //   "]",
      //   "[",
      //   "/",
      //   "B",
      //   "]",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // Second item in the fourth level 
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Another fourth level item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // Close all nested lists in the correct order
      //   "[",
      //   "/",
      //   "U",
      //   "L",
      //   "]", // Close fourth level list
        
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]", // Close third level item 2
        
      //   "[",
      //   "/",
      //   "O",
      //   "L",
      //   "]", // Close third level list
        
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]", // Close second level item 2
        
      //   // Third item in second level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "One more second level item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   "[",
      //   "/",
      //   "U",
      //   "L",
      //   "]", // Close second level list
        
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]", // Close first level item 2
        
      //   // Third item in first level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Final first level item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   "[",
      //   "/",
      //   "U",
      //   "L",
      //   "]", // Close first level list
        
      //   // Closing editor content tag
      //   "[",
      //   "/",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]"
      // ];

      // const chunks = [
      //   // Opening editor content tag
      //   "[",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]",
        
      //   // First level unordered list
      //   "[",
      //   "U",
      //   "L",
      //   "]",
        
      //   // First item in the first level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "First item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",

      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "First item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // // Second item with a simple nested list
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Second item with nested list:",
      //   "[",
      //   "U",
      //   "L",
      //   "]",
        
      //   // // // // First nested item
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Nested item one",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // // // Second nested item
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Nested item two",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // // // Close nested list
      //   "[",
      //   "/",
      //   "U",
      //   "L",
      //   "]",
        
      //   // // // Close second item
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // // Third item in first level
      //   "[",
      //   "L",
      //   "I",
      //   "]",
      //   "Third item",
      //   "[",
      //   "/",
      //   "L",
      //   "I",
      //   "]",
        
      //   // // Close first level list
      //   "[",
      //   "/",
      //   "U",
      //   "L",
      //   "]",
        
      //   // Closing editor content tag
      //   "[",
      //   "/",
      //   "E",
      //   "D",
      //   "I",
      //   "T",
      //   "O",
      //   "R",
      //   "_",
      //   "C",
      //   "O",
      //   "N",
      //   "T",
      //   "E",
      //   "N",
      //   "T",
      //   "]"
      // ];

      // const chunks = [
      //   // Opening editor content tag
      //   "[", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]",
        
      //   // First level unordered list
      //   "[", "U", "L", "]",
        
      //   // First item with bold formatting
      //   "[", "L", "I", "]",
      //   "First level item with ", "[", "B", "]", "bold", "[", "/", "B", "]", " text",
      //   "[", "/", "L", "I", "]",
        
      //   // Second item with text followed by a nested list
      //   "[", "L", "I", "]",
      //   "First level item with nested list",
      //   "[", "/", "L", "I", "]",

      //   "[LI]",
      //   "second list",
        
      //   // Nested ordered list (after the list item, as a sibling to the previous LI)
      //   "[", "O", "L", "]",
        
      //   // Items in the nested list
      //   "[", "L", "I", "]",
      //   "Second level item 1",
      //   "[", "/", "L", "I", "]",
      //   "[/OL]",
      //   "[/LI]",
      //   // "[", "L", "I", "]",
      //   // "Second level item 2 with ", "[", "I", "]", " italic", "[", "/", "I", "]",
      //   // "[", "/", "L", "I", "]",
        
      //   // // Deeper nesting - third level
      //   // "[", "L", "I", "]",
      //   // "Second level item 3",
      //   // "[", "/", "L", "I", "]",
        
      //   // "[", "U", "L", "]",
        
      //   // "[", "L", "I", "]",
      //   // "Third level item with ", "[", "ICODE", "]", "inline code", "[", "/", "ICODE", "]",
      //   // "[", "/", "L", "I", "]",
        
      //   // "[", "L", "I", "]",
      //   // "Another third level item",
      //   // "[", "/", "L", "I", "]",
        
      //   // // Close third level list
      //   // "[", "/", "U", "L", "]",
        
      //   // // Another second level item after the nested third level
      //   // "[", "L", "I", "]",
      //   // "Final second level item",
      //   // "[", "/", "L", "I", "]",
        
      //   // // Close the second level list
      //   // "[", "/", "U", "L", "]",
        
      //   // // Back to first level - third item
      //   // "[", "L", "I", "]",
      //   // "Another first level item with ", "[", "B", "]", "bold", "[", "/", "B", "]", " and ", "[", "I", "]", "italic", "[", "/", "I", "]",
      //   // "[", "/", "L", "I", "]",
        
      //   // Close the first level list
      //   "[", "/", "U", "L", "]",
        
      //   // Closing editor content tag
      //   "[", "/", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]"
      // ];


// Test Case 1: Simple two-level nesting with unordered lists
const simpleNestedUL = [
  "[", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]",
  "[", "U", "L", "]",
  "[", "L", "I", "]", "First level item 1", "[", "/", "L", "I", "]",
  "[", "L", "I", "]", 
    "First level item 2", 
    "[", "U", "L", "]",
      "[", "L", "I", "]", "Second level item 1", "[", "/", "L", "I", "]",
      "[", "L", "I", "]", "Second level item 2", "[", "/", "L", "I", "]",
    "[", "/", "U", "L", "]",
  "[", "/", "L", "I", "]",
  "[", "L", "I", "]", "First level item 3", "[", "/", "L", "I", "]",
  "[", "/", "U", "L", "]",
  "[", "/", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]"
];

// Test Case 2: Mixed UL and OL nesting
const mixedNestedLists = [
  "[", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]",
  "[", "U", "L", "]",
  "[", "L", "I", "]", "Unordered item with ", "[", "B", "]", "bold", "[", "/", "B", "]", "[", "/", "L", "I", "]",
  "[", "L", "I", "]", 
    "Unordered item with ordered sublist", 
    "[", "O", "L", "]",
      "[", "L", "I", "]", "Ordered item 1", "[", "/", "L", "I", "]",
      "[", "L", "I", "]", "Ordered item 2", "[", "/", "L", "I", "]",
    "[", "/", "O", "L", "]",
  "[", "/", "L", "I", "]",
  "[", "/", "U", "L", "]",
  "[", "/", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]"
];

// Test Case 3: Three levels of nesting
const threeDeepNesting = [
  "[", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]",
  "[", "U", "L", "]",
  "[", "L", "I", "]", "Level 1 item", "[", "/", "L", "I", "]",
  "[", "L", "I", "]", 
    "Level 1 with nesting", 
    "[", "U", "L", "]",
      "[", "L", "I", "]", "Level 2 item", "[", "/", "L", "I", "]",
      "[", "L", "I", "]", 
        "Level 2 with deeper nesting",
        "[", "U", "L", "]",
          "[", "L", "I", "]", "Level 3 item with ", "[", "I", "]", "italic", "[", "/", "I", "]", "[", "/", "L", "I", "]",
        "[", "/", "U", "L", "]",
      "[", "/", "L", "I", "]",
    "[", "/", "U", "L", "]",
  "[", "/", "L", "I", "]",
  "[", "/", "U", "L", "]",
  "[", "/", "E", "D", "I", "T", "O", "R", "_", "C", "O", "N", "T", "E", "N", "T", "]"
];

// Test Case 4: Multiple nested lists at same level
const chunks = [
  "[EDITOR_CONTENT]",
  "[UL]",              // Stack: [EC, UL]
    "[LI]",            // Stack: [EC, UL, LI]
      "[B]", "Level 1 Bold", "[/B]", // Handle B/ /B -> Stack should be [EC, UL, LI] after /B?
      "[UL]",          // Stack: [EC, UL, LI, UL]
        "[LI]",        // Stack: [EC, UL, LI, UL, LI]
          "Level 2 Item with ",
          "[ICODE]", "inline_code", "[/ICODE]", // Handle ICODE -> Stack should be [EC, UL, LI, UL, LI] after /ICODE?
            "[UL]",      // Stack: [EC, UL, LI, UL, LI, UL]
              "[LI]", "Level 3 Item A", "[/LI]", // Stack: [EC, UL, LI, UL, LI, UL]
              "[LI]",    // Stack: [EC, UL, LI, UL, LI, UL, LI]
                 "Level 3 Item B",
                 "[UL]", // Stack: [EC, UL, LI, UL, LI, UL, LI, UL]
                    "[LI]", // Stack: [EC, UL, LI, UL, LI, UL, LI, UL, LI]
                       "Deepest ", "[B]", "Level 4", "[/B]", " Item", // Handle B -> Stack: [EC, UL, LI, UL, LI, UL, LI, UL, LI] after /B?
                    "[/LI]", // Stack: [EC, UL, LI, UL, LI, UL, LI, UL]
                 "[/UL]",    // Stack: [EC, UL, LI, UL, LI, UL, LI]
              "[/LI]",       // Stack: [EC, UL, LI, UL, LI, UL]
            "[/UL]",         // Stack: [EC, UL, LI, UL, LI]
        "[/LI]",           // Stack: [EC, UL, LI, UL]
      "[/UL]",             // Stack: [EC, UL, LI]
    "[/LI]",               // Stack: [EC, UL]
    "[LI]", "Another Level 1 Item", "[/LI]", // Stack: [EC, UL]
  "[/UL]",                 // Stack: [EC]
  "[/EDITOR_CONTENT]"      // Stack: []
];

// NOTE: You'll need to break the strings containing tags AND text into smaller pieces
// like your original chunks, e.g., "[", "L", "I", "]", "L", "e", "v", "e", "l", ... etc.
// Also add explicit [/B] and [/ICODE] if your parser requires them (it seems it might not
// based on the original stream log, but maybe that's part of the bug?).
// If your parser *implicitly* handles closing B/ICODE when a block tag like UL/LI starts/ends,
// ensure that logic is correctly managing the stack.
// You might need to break the strings further if your original chunks were char-by-char
// e.g., "[", "E", "D", "I", "T", "O", "R", ... etc.

      // First send a "START_STREAM" event to initialize
      controller.enqueue(`data: START_STREAM\n\n`);

      // Function to send chunks with delays to simulate streaming
      const sendChunks = async () => {
        for (const chunk of chunks) {
          // Format properly for SSE - each chunk needs "data: " prefix and double newline
          controller.enqueue(`data: ${chunk}\n\n`);

          // Simulate variable timing between chunks (20-200ms)
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
