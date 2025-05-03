import OpenAI from "openai";
import { wrisorChatModePrompt } from "../prompts/wrisor-chatmode-prompt-v1";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-composer-prompt-v1";
import { Env } from "../../worker-configuration";


  let deepseekClient: OpenAI | null = null;

export function getClient(env: Env): OpenAI {
  if (deepseekClient === null) {
    console.log("Initializing Deepseek AI Client for this isolate...");
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error("Missing DEEPSEEK_API_KEY secret in environment configuration!");
    }
    console.log("DEEPSEEK API KEY IS: ", env.DEEPSEEK_API_KEY)
    deepseekClient = new OpenAI({ baseURL: "https://api.deepseek.com",
        apiKey: env.DEEPSEEK_API_KEY,});
  }
  return deepseekClient;
}
  


export async function streamWithDeepseek(prompt: string) {

  const completion = await deepseekClient!.chat.completions.create({
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
  env: Env
}

export async function handleDeepseekStream(props: HandleDeepseekStreamProps) {

  console.log("Props are: ", props.env)

    if(!deepseekClient){
        console.log("No deepseek client so setting one!!!")
        getClient(props.env)
    }

    const { prompt, chatMode, contentNodes } = props;
    const systemPrompt = chatMode === "CHAT" ? wrisorChatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes);


    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                controller.enqueue(encoder.encode(`data: START_STREAM \n\n`));

                const streamedCompletion = await streamWithDeepseek(systemPrompt); 
                console.log("Received stream from Deepseek API."); 

                for await (const chunk of streamedCompletion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                      const safeText = content
                      .replace(/\n/g, "\\n")
                      .replace(/\r/g, "\\r")
                      .replace(/\t/g, "\\t");
                        const sseMessage = `data: ${safeText}\n\n`;
                        controller.enqueue(encoder.encode(sseMessage));
                        console.log(`Raw content chunk: "${content.replace(/\n/g, "\\n")}"`);
                    }
                }

                console.log("Finished iterating Deepseek stream, sending [DONE]");
                controller.enqueue(encoder.encode(`data: [DONE] \n\n`));
                controller.close();
            } catch (error) {
                console.error("Error inside ReadableStream start:", error);
                // You might want to encode an error message for the client too
                try {
                   const errorMsg = `data: {"error": "Streaming failed"}\n\n`;
                   controller.enqueue(encoder.encode(errorMsg));
                   controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                } catch (e) { /* ignore enqueue error */ }
                controller.error(error); // Signal stream error
            }
        },
        cancel(reason){
            console.log("Stream cancelled:", reason);
            // Add logic here if the stream can be cancelled (e.g., closing connections)
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
