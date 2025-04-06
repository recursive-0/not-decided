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

        const chunks = [
          // 1. Edge case: Single character chunks for opening tag
          "[",
          "E",
          "D",
          "I",
          "T",
          "O",
          "R",
          "_",
          "C",
          "O",
          "N",
          "T",
          "E",
          "N",
          "T",
          "]",
          
          // 2. Edge case: Empty paragraph followed by non-empty paragraph
          "[",
          "P",
          "]",
          "[",
          "/",
          "P",
          "]",
          "[P]This is content.[/P]",
          
          // 3. Edge case: Nested formatting with splits at critical positions
          "[P]Testing [",
          "B]bo",
          "ld [",
          "I]and it",
          "al",
          "ic[/",
          "I] te",
          "xt[/",
          "B] format.[/P]",
          
          // 5. Edge case: Tag-like content within text that isn't a real tag
          "[P]Users might type something like [this] or [/that] which looks",
          " like tags but aren't[/P]",
          
          
          // // 7. Edge case: Inline code with bracket characters inside
          "[P]Using [",
          "ICODE]array[",
          "index",
          "][/",
          "ICODE] notation in JavaScript.[/P]",
          
          // // 8. Edge case: Code block with tokens that look like your format tags
          "[CO",
          "DE]<div className=\"[container]\">",
          "  {items.map(item => (",
          "    <span key={item.id}>[{item.name}]</span>",
          "  ))}",
          "  {/* Comment with [/CODE] text */}",
          "</div>[/CODE]",
          
          // // 9. Edge case: Checkbox with split exactly between attributes
          "[CHECK",
          "BOX]Complex ",
          "item with [B]formatting[/B] inside[/CHECK",
          "BOX]",
          
          // // 10. Edge case: Split after backslash in a code block (escape sequence handling)
          "[CODE]const newStr = \"Test\\",
          "nWith newline\";\n",
          "const path = \"C:\\\\",
          "Program Files\\\\App\";\n",
          "const regex = /\\[\\]/g;[/CODE]",
          
          // // 11. Edge case: Unicode characters and emojis split across chunks
          "[P]Unicode test: ",
          "😀",
          "👍",
          "🚀",
          " with splits between multi-byte characters: ",
          "こ",
          "ん",
          "に",
          "ち",
          "は[/P]",
          
          // // 12. Edge case: Consecutive tags with no content
          "[B][/",
          "B][I][/",
          "I][CODE][/",
          "CODE]",
          
          // // 13. Edge case: Tag splits with whitespace that might be significant
          "[P]Text with ",
          "  multiple    ",
          "spaces   and\t",
          "tabs\t\t\tthat should be ",
          "preserved.[/P]",
          
          // // 14. Edge case: Lists with extremely complex formatting
          "[UL][LI][B]Item [I]with[/I][/",
          "B] [ICODE]code[/ICODE] formatting[/LI][LI]Item with [",
          "U",
          "L][L",
          "I]Nested item[/LI][/UL][/LI][/UL]",
          
          // // 15. Edge case: Content that looks like a malformed tag
          "[P]This text contains [something that looks like a tag but isn't closed and [",
          "another/one] with weird syntax[/P]",
          
          // // 16. Edge case: HTML-like content that might confuse the parser
          "[P]Some users might try to use <div>HTML tags</div> or <br> tags[/P]",
          
          // // 17. Edge case: Extremely long tag content with minimal splits
          "[P]",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies.",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies. Nullam auctor, nisl eget ultricies ultricies, nisl nisl ultricies nisl, eget ultricies nisl nisl eget ultricies.",
          "[/P]",
          
          // // 18. Edge case: Quotes within quotes within tags
          "[P]He said, \"[B]The programmer wrote '[ICODE]console.log(\"[B]Nested[/B]\")'[/ICODE] in the code[/B]\" yesterday[/P]",
          
          // // 19. Edge case: Almost-matching tag patterns that aren't real tags
          "[P]Text with almost-tags like [BOLDTEXT] or [/PARAGRAPH] that look similar to real tags[/P]",
          
          // // 20. Edge case: Various bracket patterns that might confuse the parser
          "[P]Various brackets: [ [ [ ] ] ] and [[[[nested]]]] brackets and [isolated][/P]",
          
          // // 21. Edge case: Split exactly between closing tag elements
          "[H1]Title[",
          "/",
          "H",
          "1",
          "]",
          
          // // 22. Edge case: Malformed but recognizable HTML-like tags
          "[P]Some <div class=\"test\">HTML content</div> with <br/> tags[/P]",
          
          // // 23. Edge case: Tag-like markdown code
          "[P]Markdown `[code]` that looks like tags with `[/closing]` elements[/P]",
          
          // // 24. Edge case: Tags with unusual whitespace
          "[P   ]Whitespace inside tag delimiters[/   P]",
          
          // // 25. Edge case: Edge case for numeric ordered lists with split ID
          "[OL][LI]First[/LI][LI",
          "]Second[/LI][L",
          "I]Third[/LI][/OL]",
          
          // // 26. Edge case: Combining with markdown-like syntax
          "[P]This is **bold in markdown** but should be [B]bold in our format[/B][/P]",
          
          // // 27. Edge case: Case-sensitivity tests
          "[p]Lower case tag that should be uppercase[/p][B]This is correct[/b]",
          
          // // 28. Edge case: Tags within URL-like strings
          "[P]Visit https://example.com/[something]/[another] for details[/P]",
          
          // // 29. Edge case: Extremely deeply nested formatting
          "[B][I][B][I][B][I]Extremely nested[/I][/B][/I][/B][/I][/B]",
          
          // // 30. Edge case: Special XML entities within content
          "[P]Text with &lt; and &gt; and &amp; entities that could be confused with tags[/P]",
          
          // // 31. Edge case: Closing the EDITOR_CONTENT tag with splits
          "[",
          "/",
          "E",
          "D",
          "I",
          "T",
          "O",
          "R",
          "_",
          "C",
          "O",
          "N",
          "T",
          "E",
          "N",
          "T",
          "]"
        ];
        // const chunks = [
        //     "[P]Hey there this i",
        //     "s a [B]bold[/B] tag that shou",
        //     "ld go onto new line [/P]"
        // ]
  
        // First send a "START_STREAM" event to initialize
        controller.enqueue(`data: START_STREAM\n\n`);
  
        // Function to send chunks with delays to simulate streaming
        const sendChunks = async () => {
          for (const chunk of chunks) {
            // Format properly for SSE - each chunk needs "data: " prefix and double newline
            controller.enqueue(`data: ${chunk}\n\n`);
            
            // Simulate variable timing between chunks (20-200ms)
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          controller.close();
        };
  
        // Start sending chunks
        sendChunks().catch(err => {
          console.error("Error in static stream:", err);
          controller.error(err);
        });
      }
    });
  
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }