import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { chatModePrompt, composerModePrompt } from "../prompts/markdown-instructions-prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


interface HandleGeminiStreamProps {
  prompt: string;
  chatMode: "CHAT" | "COMPOSER"
}

export async function handleGeminiStream(props: HandleGeminiStreamProps) {
  const { prompt, chatMode } = props;

  const systemInstructionContent = chatMode === "CHAT" ? chatModePrompt() : composerModePrompt()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-pro-exp-03-25",

          systemInstruction: {
            role: "system",
            parts: [{ text: systemInstructionContent }],
          },
        });

        const generationConfig = {
          temperature: 0.7,
        };

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
