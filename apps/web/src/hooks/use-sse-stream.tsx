import { useCallback, useRef, useState } from "react";

export const useSSEStream = () => {
    const [content, setContent] = useState<string>("");
    const eventSourceRef = useRef<EventSource | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const startStreaming = useCallback(async (
        prompt: string, 
        onToken?: (token: string) => void
    ) => {
        try {
            setIsLoading(true);
            setError(null);
            setContent("");

            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const response = await fetch("http://localhost:4000/api/generate/init", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error("Failed to initialize stream!");
            }

            const { streamId } = await response.json();
            
            eventSourceRef.current = new EventSource(
                `http://localhost:4000/api/generate/stream/${streamId}`
            );

            eventSourceRef.current.onmessage = (event) => {
                const token = event.data;
                
                // Update internal state
                setContent(prev => prev + token);
                
                // Call the callback if provided
                if (onToken) {
                    onToken(token);
                }
            };
            
            eventSourceRef.current.onerror = (err) => {
                console.error("SSE Error:", err);
                setError(new Error("Stream error occurred"));
                setIsLoading(false);
                eventSourceRef.current?.close();
            };
            
            // Listen for stream completion
            eventSourceRef.current.addEventListener('complete', () => {
                setIsLoading(false);
                eventSourceRef.current?.close();
            });

        } catch (error: any) {
            setError(error);
            setIsLoading(false);
        }
    }, []);

    const stopStreaming = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsLoading(false);
    }, []);

    return { 
        content,
        isLoading, 
        error,
        startStreaming,
        stopStreaming
    };
};