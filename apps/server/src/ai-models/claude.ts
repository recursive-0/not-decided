import Anthropic from "@anthropic-ai/sdk";
import { chatModePrompt } from "../prompts/markdown-instructions-prompt";
import { composerModePrompt } from "../prompts/composer-mode-prompt";
import { wrisorSystemPrompt } from "../prompts/wrisor-system-prompt";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-system-prompt-1";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});


interface HandleClaudeStreamProps {
  prompt: string;
  chatMode: "CHAT" | "COMPOSER"
  contentNodes: any
}

export async function handleClaudeStream(props: HandleClaudeStreamProps) {
  const { prompt, chatMode, contentNodes } = props;

  const systemPrompt = chatMode === "CHAT" ? chatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes)

  console.log("SYSTEM PROMPT IS: ", systemPrompt)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`);

        const tokens = await client.messages.countTokens({
          messages: [{ role: "user", content: prompt }],
          system: systemPrompt,
          model: "claude-3-7-sonnet-20250219",
        })
        
        console.log("INPUT TOKENS ARE: ", tokens)

        const messageStream = await client.messages.stream({
          messages: [{ role: "user", content: prompt }],
          system: systemPrompt,
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 8000,
        });
        
        // Create a separate handler function with the correct controller reference
        const handleText = (text: string) => {
            console.log(`content is: "${text.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`);
            const safeText = text.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            controller.enqueue(`data: ${safeText}\n\n`);
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