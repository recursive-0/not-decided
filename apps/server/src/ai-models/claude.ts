import Anthropic from "@anthropic-ai/sdk";
import { markdownFormatPrompt } from "../prompts/markdown-instructions-prompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = markdownFormatPrompt();

interface HandleClaudeStreamProps {
  prompt: string;
}

export async function handleClaudeStream(props: HandleClaudeStreamProps) {
  const { prompt } = props;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`);
        
        const messageStream = await client.messages.stream({
          messages: [{ role: "user", content: prompt }],
          system: systemPrompt,
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 8000,
        });
        
        // Create a separate handler function with the correct controller reference
        const handleText = (text: string) => {
            console.log(`content is: "${text.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`);
            controller.enqueue(`data: ${text}\n\n`);
        };
        
        // Use the handler
        messageStream.on("text", handleText);
        
        // Wait for the stream to complete
        await messageStream.finalMessage();
        
        console.log("calling close");
        controller.enqueue(`data: [DONE] \n\n`);
        controller.close();
      } catch (error) {
        console.error("Error while streaming with Claude", error);
        controller.error(error);
      }
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