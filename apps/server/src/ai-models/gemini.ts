import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { chatModePrompt } from "../prompts/markdown-instructions-prompt";
import { composerModePrompt } from "../prompts/composer-mode-prompt";
import { wrisorSystemPrompt } from "../prompts/wrisor-system-prompt";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-system-prompt-1";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


interface HandleGeminiStreamProps {
  prompt: string;
  chatMode: "CHAT" | "COMPOSER"
  contentNodes: any
}

export async function handleGeminiStream(props: HandleGeminiStreamProps) {
  const { prompt, chatMode, contentNodes } = props;

  console.log("CHATMODE IS: ", chatMode)

  const systemInstructionContent = chatMode === "CHAT" ? chatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-preview-04-17",

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
