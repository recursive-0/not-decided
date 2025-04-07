import Groq from "groq-sdk";
import { chatModePrompt, composerModePrompt } from "../prompts/markdown-instructions-prompt"; 


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});


interface HandleGroqStreamProps {
  prompt: string;
  chatMode: "CHAT" | "COMPOSER"
}

export async function handleGroqStream(props: HandleGroqStreamProps) {
  const { prompt, chatMode } = props;

  const systemPrompt = chatMode === "CHAT" ? chatModePrompt() : composerModePrompt()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: START_STREAM \n\n`);

        
        const chatStream = await groq.chat.completions.create({
          
          messages: [
            
            {
              role: "system",
              content: systemPrompt,
            },
            
            {
              role: "user",
              content: prompt,
            },
          ],
          
          
          model: "llama3-70b-8192", 
          stream: true, 
          
          
          
          
        });

        
        for await (const chunk of chatStream) {
          
          const deltaContent = chunk.choices[0]?.delta?.content;

          
          if (deltaContent) {
             
            
            const safeText = deltaContent.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            console.log("CHUNK IS: ", safeText)
            controller.enqueue(`data: ${safeText}\n\n`);
          }

          
          
          
          
        }

        
        console.log("Groq stream finished.");
        controller.enqueue(`data: [DONE] \n\n`);
        controller.close();

      } catch (error) {
        console.error("Error while streaming with Groq:", error);
        
        try {
            const errorMessage = error instanceof Error ? error.message : "Unknown streaming error";
            
            const safeError = JSON.stringify({ error: errorMessage }).replace(/\n/g, "\\n");
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