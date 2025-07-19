import { GoogleGenAI } from "@google/genai";
import { Env } from "../../worker-configuration";
import { wrisorChatModePrompt } from "../prompts/wrisor-chatmode-prompt-v1";
import { wrisorSystemPrompt } from "../prompts/wrisor-composer-prompt-v1";


  let genAIClient: GoogleGenAI | null = null;

export function getClient(env: Env): GoogleGenAI {
  if (genAIClient === null) {
    console.log("Initializing Google AI Client for this isolate...");
    if (!env.GEMINI_API_KEY) { // Make sure Env interface includes GEMINI_API_KEY: string
      throw new Error("Missing GEMINI_API_KEY secret in environment configuration!");
    }
    genAIClient = new GoogleGenAI({apiKey: env.GEMINI_API_KEY});
  }
  return genAIClient;
}
  
  
  interface HandleGeminiStreamProps {
    prompt: string;
    chatMode: "CHAT" | "COMPOSER"
    contentNodes: any
    env: Env
  }
  
  export async function handleGeminiStream(props: HandleGeminiStreamProps) {

    if(!genAIClient){
        getClient(props.env)
    }
    
    const { prompt, chatMode, contentNodes } = props;

  
    console.log("CHATMODE IS: ", chatMode)
  
    const systemInstructionContent = chatMode === "CHAT" ? wrisorChatModePrompt() : wrisorSystemPrompt(prompt, contentNodes)
  
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        console.log("INSIDE GEMINI CONTROLLER")
        try {
          controller.enqueue(encoder.encode(`data: START_STREAM \n\n`));
  
          const streamResult = await genAIClient!.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: {
              role: "user",
              parts: [{text: prompt}]
            },
            config: {
              // tools: [{googleSearch: {}}],
              systemInstruction: {
                role: "system",
                parts: [{ text: systemInstructionContent }],
              },
            }
          });
  
  
          console.log("INSIDE GEMOINI TEMP SETTTTT")
          console.log("Stream result is: ", streamResult)
  
          for await (const chunk of streamResult) {
            const chunkText = chunk.text; // Assuming .text() is correct, or chunk.text
            if (chunkText) {
              // THE FIX: Process multi-line chunks to be SSE compliant.
              const lines = chunkText.split('\n');
              const formattedChunk = lines.map(line => `data: ${line}`).join('\n');
              const sseMessage = `${formattedChunk}\n\n`;
          
              console.log("CORRECTED SSE MESSAGE:", sseMessage);
              controller.enqueue(encoder.encode(sseMessage));
            }
          }
  
          console.log("Gemini stream finished.");
          controller.enqueue(encoder.encode(`data: [DONE] \n\n`));
          controller.close();
        } catch (error) {
          console.error("Error while streaming with Gemini:", error);
  
          try {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown streaming error";
            const safeError = JSON.stringify({ error: errorMessage }).replace(
              /\n/g,
              "\\n"
            );
            controller.enqueue(`data: ${safeError}\n\n`);
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } catch (enqueueError) {
            console.error("Error sending error message to client:", enqueueError);
          } finally {
            controller.error(error);
          }
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
  