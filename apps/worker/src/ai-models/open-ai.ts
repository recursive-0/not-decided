import OpenAI from "openai";
import { wrisorChatModePrompt } from "../prompts/wrisor-chatmode-prompt-v1";
import { wrisorSystemPromptV1 } from "../prompts/wrisor-composer-prompt-v1";
import { Env } from "../../worker-configuration"; // Ensure this path is correct

// Global variable to hold the OpenAI client instance
let openAIClientInstance: OpenAI | null = null;

/**
 * Initializes and returns an OpenAI client.
 * Uses a singleton pattern to ensure only one client is created.
 * @param {Env} env - The environment object containing the API key.
 * @returns {OpenAI} The OpenAI client instance.
 * @throws {Error} If the OPEN_AI_API_KEY is missing.
 */
export function getOpenAIClient(env: Env): OpenAI {
  if (openAIClientInstance === null) {
    console.log("Initializing OpenAI Client for this isolate...");
    if (!env.OPEN_AI_API_KEY) {
      throw new Error("Missing OPEN_AI_API_KEY secret in environment configuration!");
    }
    // console.log("OpenAI API Key is set."); // Avoid logging keys
    openAIClientInstance = new OpenAI({
      apiKey: env.OPEN_AI_API_KEY,
      // No baseURL needed, it defaults to OpenAI's API
    });
  }
  return openAIClientInstance;
}

/**
 * Creates a streaming chat completion with the OpenAI API.
 * @param {string} systemContent - The content for the system role message.
 * @param {string} userContent - The content for the user role message.
 * @param {string} [modelName="gpt-4o"] - The OpenAI model to use.
 * @returns {Promise<OpenAI.Chat.Completions.ChatCompletionChunk[]>} A stream of completion chunks.
 * @throws {Error} If the OpenAI client is not initialized.
 */
export async function streamWithOpenAI(
  systemContent: string,
  userContent: string,
  modelName: string = "gpt-4.1" // Using "gpt-4o" as a good default, "gpt-3.5-turbo" is also an option
) {
  if (!openAIClientInstance) {
    throw new Error("OpenAI client not initialized. Call getOpenAIClient first.");
  }

  const completion = await openAIClientInstance.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    stream: true,
    max_tokens: 8000, // Adjusted for typical OpenAI model output limits for streaming
  });

  return completion;
}

// Interface for the properties passed to the stream handler
interface HandleOpenAIStreamProps {
  prompt: string; // This is the user's current message/input
  chatMode: "COMPOSER" | "CHAT";
  contentNodes: any; // Assuming this structure is defined elsewhere
  env: Env;
}

/**
 * Handles an incoming request and streams a response from the OpenAI API
 * using Server-Sent Events (SSE).
 * @param {HandleOpenAIStreamProps} props - The properties for handling the stream.
 * @returns {Promise<Response>} A streaming SSE response.
 */
export async function handleOpenAIStream(props: HandleOpenAIStreamProps): Promise<Response> {
  // Ensure the OpenAI client is initialized
  if (!openAIClientInstance) {
    // console.log("OpenAI client not set. Initializing now..."); // More concise logging
    getOpenAIClient(props.env); // This initializes the global openAIClientInstance
  }

  const { prompt: userPrompt, chatMode, contentNodes } = props;

  // Determine the system prompt based on the chat mode
  // It's assumed that wrisorSystemPromptV1 might use userPrompt and contentNodes
  // to construct a more elaborate system message for "COMPOSER" mode.
  const systemMessageContent =
    chatMode === "CHAT"
      ? wrisorChatModePrompt()
      : wrisorSystemPromptV1(userPrompt, contentNodes);

  const encoder = new TextEncoder();

  console.log("Going inside readable stream")

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: START_STREAM \n\n`));

        // Call the new streamWithOpenAI function
        const streamedCompletion = await streamWithOpenAI(
          systemMessageContent,
          userPrompt
          // You can also pass a specific model name here if needed, e.g.:
          // "gpt-3.5-turbo"
        );
        console.log("Received stream from OpenAI API.");

        for await (const chunk of streamedCompletion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            // Ensure content is safely encoded for SSE
            const safeText = content
              .replace(/\n/g, "\\n") // Escape newlines
              .replace(/\r/g, "\\r") // Escape carriage returns
              .replace(/\t/g, "\\t"); // Escape tabs
            const sseMessage = `data: ${safeText}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
            // console.log(`OpenAI Raw content chunk: "${safeText}"`); // Optional: for debugging chunks
          }
        }

        console.log("Finished iterating OpenAI stream, sending [DONE]");
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error("Error inside ReadableStream start (OpenAI):", error);
        try {
          // Send an error message to the client if possible
          const errorData = error instanceof Error ? error.message : "Streaming failed";
          const errorMsgSse = `data: {"error": "${errorData.replace(/"/g, '\\"')}"}\n\n`;
          controller.enqueue(encoder.encode(errorMsgSse));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`)); // Ensure client knows stream ended
        } catch (e) {
          // Ignore errors during error message enqueueing
        }
        controller.error(error); // Signal that the stream encountered an error
      }
    },
    cancel(reason) {
      console.log("OpenAI Stream cancelled:", reason);
      // Add any necessary cancellation logic here (e.g., if OpenAI SDK supports AbortController)
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