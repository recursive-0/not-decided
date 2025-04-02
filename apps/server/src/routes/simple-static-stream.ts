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
            // ... your existing chunks ...
            
            // Code section with broken chunks
            "[",
            "P]Here's an example of using the Performance API to measure page load:[/",
            "P]\n\n",
            
            // Add code block chunks
            "[",
            "CODE]",
            "// Performance measurement example",
            "const perfData = window.performance.timing; \n",
            "const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart; \n",
            "console.log(`Page load time: ${pageLoadTime}ms`);",
            "[/",
            "CODE]"
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