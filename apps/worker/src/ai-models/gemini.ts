import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-composer-prompt-v1";
import { wrisorChatModePrompt } from "../prompts/wrisor-chatmode-prompt-v1";
import { Env } from "../../worker-configuration";



  let genAIClient: GoogleGenerativeAI | null = null;

export function getClient(env: Env): GoogleGenerativeAI {
  if (genAIClient === null) {
    console.log("Initializing Google AI Client for this isolate...");
    if (!env.GEMINI_API_KEY) { // Make sure Env interface includes GEMINI_API_KEY: string
      throw new Error("Missing GEMINI_API_KEY secret in environment configuration!");
    }
    genAIClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
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
  
    const systemInstructionContent = chatMode === "CHAT" ? wrisorChatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes)
  
    const stream = new ReadableStream({
      async start(controller) {
        console.log("INSIDE GEMINI CONTROLLER")
        try {
          controller.enqueue(`data: START_STREAM \n\n`);
  
          const model = genAIClient!.getGenerativeModel({
            model: "gemini-2.5-flash-preview-04-17",
  
            systemInstruction: {
              role: "system",
              parts: [{ text: systemInstructionContent }],
            },
          });
  
          const generationConfig = {
            temperature: 0.7,
          };
  
          console.log("INSIDE GEMOINI TEMP SETTTTT")
  
          const streamResult = await model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: generationConfig,
          });
  
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
  
            if (chunkText) {
              const safeText = chunkText
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t");
                console.log("CHUNK IS: ", safeText)
              controller.enqueue(`data: ${safeText}\n\n`);
            }
          }
  
          console.log("Gemini stream finished.");
          controller.enqueue(`data: [DONE] \n\n`);
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
            controller.enqueue(`data: [DONE] \n\n`);
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
  