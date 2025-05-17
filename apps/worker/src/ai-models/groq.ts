import Groq from "groq-sdk";
import { wrisorChatModePrompt } from "../prompts/wrisor-chatmode-prompt-v1"; // Assuming these paths are correct
import { wrisorSystemPromptV1 } from "../prompts/wrisor-composer-prompt-v1"; // Assuming these paths are correct
import { Env } from "../../worker-configuration"; // Ensure this path is correct

// Global variable to hold the Groq client instance
let groqClientInstance: Groq | null = null;

/**
 * Initializes and returns a Groq client.
 * Uses a singleton pattern to ensure only one client is created.
 * @param {Env} env - The environment object containing the API key.
 * @returns {Groq} The Groq client instance.
 * @throws {Error} If the GROQ_API_KEY is missing.
 */
export function getGroqClient(env: Env): Groq {
  if (groqClientInstance === null) {
    console.log("Initializing Groq Client for this isolate...");
    if (!env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY secret in environment configuration!");
    }
    // console.log("Groq API Key is set."); // Avoid logging keys for security
    groqClientInstance = new Groq({
      apiKey: env.GROQ_API_KEY,
      // The Groq SDK does not require a baseURL if using the standard API endpoint.
      // dangerouslyAllowBrowser: true, // Uncomment if running in a browser-like environment and understand the risks
    });
  }
  return groqClientInstance;
}

/**
 * Creates a streaming chat completion with the Groq API.
 * @param {string} systemContent - The content for the system role message.
 * @param {string} userContent - The content for the user role message.
 * @param {string} [modelName="llama3-70b-8192"] - The Groq model to use. Other options: "mixtral-8x7b-32768".
 * @returns {Promise<Groq.Chat.Completions.ChatCompletionChunk[]>} A stream of completion chunks.
 * @throws {Error} If the Groq client is not initialized.
 */
export async function streamWithGroq(
  systemContent: string,
  userContent: string,
  modelName: string = "deepseek-r1-distill-llama-70b" // A common high-performance model on Groq
) {
  if (!groqClientInstance) {
    throw new Error("Groq client not initialized. Call getGroqClient first.");
  }

  // Note: Groq API might prefer the system prompt as the first message if it's short,
  // or integrated into the user prompt for some models.
  // For consistency with OpenAI, we'll use a separate system message.
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: userContent,
    },
  ];

  const completion = await groqClientInstance.chat.completions.create({
    model: modelName,
    messages: messages,
    stream: true,
    // max_tokens can be set if needed, e.g., 4000. Groq models often have large context windows.
    // For Llama3-70B, the context is 8192 tokens.
    // max_tokens: 4096, // Example: Max tokens for the generated response
  });

  return completion;
}

// Interface for the properties passed to the stream handler
interface HandleGroqStreamProps {
  prompt: string; // This is the user's current message/input
  chatMode: "COMPOSER" | "CHAT";
  contentNodes: any; // Assuming this structure is defined elsewhere
  env: Env;
}

/**
 * Handles an incoming request and streams a response from the Groq API
 * using Server-Sent Events (SSE).
 * @param {HandleGroqStreamProps} props - The properties for handling the stream.
 * @returns {Promise<Response>} A streaming SSE response.
 */
export async function handleGroqStream(props: HandleGroqStreamProps): Promise<Response> {
  // Ensure the Groq client is initialized
  if (!groqClientInstance) {
    getGroqClient(props.env); // This initializes the global groqClientInstance
  }

  const { prompt: userPrompt, chatMode, contentNodes } = props;

  const systemMessageContent =
    chatMode === "CHAT"
      ? wrisorChatModePrompt()
      : wrisorSystemPromptV1(userPrompt, contentNodes);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: START_STREAM \n\n`));

        const streamedCompletion = await streamWithGroq(
          systemMessageContent,
          userPrompt
          // You can also pass a specific model name here, e.g.:
          // "mixtral-8x7b-32768"
        );
        console.log("Received stream from Groq API.");

        for await (const chunk of streamedCompletion) {
          // The structure of Groq's streaming chunk is similar to OpenAI's
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const safeText = content
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r")
              .replace(/\t/g, "\\t");
            const sseMessage = `data: ${safeText}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
            // console.log(`Groq Raw content chunk: "${safeText}"`); // Optional for debugging
          }
        }

        console.log("Finished iterating Groq stream, sending [DONE]");
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error("Error inside ReadableStream start (Groq):", error);
        try {
          const errorData = error instanceof Error ? error.message : "Streaming failed with Groq";
          const errorMsgSse = `data: {"error": "${errorData.replace(/"/g, '\\"')}"}\n\n`;
          controller.enqueue(encoder.encode(errorMsgSse));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (e) {
          // Ignore errors during error message enqueueing
        }
        controller.error(error);
      }
    },
    cancel(reason) {
      console.log("Groq Stream cancelled:", reason);
      // Add cancellation logic if the Groq SDK supports it (e.g., AbortController)
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
