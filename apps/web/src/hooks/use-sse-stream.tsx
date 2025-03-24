import { useCallback, useRef, useState } from "react";
import { extendedProseMirrorSchema, useEditor } from "@/providers/editor-context-provider";
import { IncrementalProsemirrorRenderer } from "@/lib/incremental-prosemirror-renderer";
import { IncrementalParser } from "@/lib/incremental-node-parser";

export const useSSEStream = () => {
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { editorView } = useEditor();
    
    const parserRef = useRef<IncrementalParser | null>(null);
    const rendererRef = useRef<IncrementalProsemirrorRenderer | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const startStreaming = useCallback(async (prompt: string) => {
        try {

            setIsLoading(true);
            setError(null);
            setContent("");


            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            

            if (!rendererRef.current && editorView.current) {
                rendererRef.current = new IncrementalProsemirrorRenderer(
                    editorView.current,
                    extendedProseMirrorSchema
                );
            }
        

            if (!parserRef.current && rendererRef.current) {
                parserRef.current = new IncrementalParser({
                    onOpenTag: (tag) => rendererRef.current?.onOpenTag(tag),
                    onCloseTag: (tag) => rendererRef.current?.onCloseTag(tag),
                    onTextContent: (text) => rendererRef.current?.onTextContent(text)
                });
            }

            // Initialize stream
            const response = await fetch("http://localhost:4000/api/generate/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error("Failed to initialize stream!");
            }

            const { streamId } = await response.json();
            
            // Setup SSE
            eventSourceRef.current = new EventSource(
                `http://localhost:4000/api/generate/stream/${streamId}`
            );

            // Handle messages
            eventSourceRef.current.onmessage = (event) => {
                const token = event.data;

                console.log("TOKEN IS", token)

                switch (token.trim()) {
                    case "[DONE]":
                    case "END_STREAM":
                        parserRef.current?.stopStreaming();
                        setIsLoading(false);
                        eventSourceRef.current?.close();
                        return;
                        
                    case "START_STREAM":
                        parserRef.current?.startStreaming();
                        return;
                        
                    default:
                        const decodedToken = token.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
                        setContent(prev => prev + decodedToken);
                        parserRef.current?.process(decodedToken);
                }
            };

            // Handle errors
            eventSourceRef.current.onerror = (err) => {
                console.error("SSE Error:", err);
                setError(new Error("Stream error occurred"));
                parserRef.current?.stopStreaming();
                eventSourceRef.current?.close();
                setIsLoading(false);
            };

        } catch (error: any) {
            setError(error);
            setIsLoading(false);
        }
    }, [editorView]);

    const stopStreaming = useCallback(() => {
        parserRef.current?.stopStreaming();
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        
        setIsLoading(false);
        setContent("");
    }, []);

    return { 
        content,
        isLoading, 
        error,
        startStreaming,
        stopStreaming
    };
};