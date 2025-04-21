import OpenAI from "openai";
import { chatModePrompt } from "../prompts/chat-mode-prompt";
import { composerModePrompt } from "../prompts/composer-mode-prompt";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-system-prompt-1";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});


export async function streamWithDeepseek(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
    max_tokens: 8000,
  });

  return completion;
}

interface HandleDeepseekStreamProps {
  prompt: string;
  chatMode: "COMPOSER" | "CHAT"
  contentNodes: any
}

export async function handleDeepseekStream(props: HandleDeepseekStreamProps) {
  const { prompt, chatMode, contentNodes } = props;

  const systemPrompt = chatMode === "CHAT" ? chatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`)
        const streamedToken = await streamWithDeepseek(systemPrompt);

        for await (const chunk of streamedToken) {
          const content = chunk.choices[0]?.delta.content;
          if (content) {
            controller.enqueue(`data: ${content}\n\n`);
            console.log(`content is: "${content.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`);
          }
        }

        console.log("calling close");
        controller.enqueue(`data: [DONE] \n\n`);
        controller.close();
      } catch (error) {
        console.error("Error while streaming with deepseek", error);
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
