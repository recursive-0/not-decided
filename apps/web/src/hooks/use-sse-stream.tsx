import { useCallback, useRef, useState } from "react";
import { ProseMirrorNodeParser } from "@/lib/prosemirror-node-parser";
import { schema } from "prosemirror-schema-basic";
import { Node } from "prosemirror-model";
import { extendedProseMirrorSchema, useEditor } from "@/providers/editor-context-provider";

export const useSSEStream = () => {
    const [content, setContent] = useState<string>("");
    const eventSourceRef = useRef<EventSource | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { editorView } = useEditor();
    
    const parserRef = useRef<ProseMirrorNodeParser | null>(null);

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
            
            if (!parserRef.current) {
                parserRef.current = new ProseMirrorNodeParser(extendedProseMirrorSchema, ({ nodeJSON, nodeIndex }) => {
                    console.log("ProseMirror node formed:", nodeJSON);
                    
                    if (editorView.current) {
                        try {
                            const node = Node.fromJSON(extendedProseMirrorSchema, nodeJSON);
                            console.log("PERFECT NODE", node);
                            
                            const pos = editorView.current.state.doc.content.size;
                            const transaction = editorView.current.state.tr.insert(pos, node);
                            
                            editorView.current.dispatch(transaction);
                        } catch (error) {
                            console.error("Error creating node:", error);
                        }
                    }
                });
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
                console.log("token received:", token);

                if (token.trim() === "[DONE]") {
                    if (parserRef.current) {
                        parserRef.current.stopStreaming();
                    }
                    
                    setIsLoading(false);
                    eventSourceRef.current?.close();
                    return;
                }
                
                if (token.trim() === "START_STREAM") {
                    if (parserRef.current) {
                        console.log("Starting the stream now");
                        parserRef.current.startStreaming();
                    }
                    return;
                }
                
                if (token.trim() === "END_STREAM") {
                    if (parserRef.current) {
                        parserRef.current.stopStreaming();
                    }
                    return;
                }
                
                setContent(prev => prev + token);
                
                if (parserRef.current) {
                    parserRef.current.processTokens(token);
                }
                
            };
            
            eventSourceRef.current.onerror = (err) => {
                console.error("SSE Error:", err);
                setError(new Error("Stream error occurred"));
                setIsLoading(false);
                
                if (parserRef.current) {
                    parserRef.current.stopStreaming();
                }
                
                eventSourceRef.current?.close();
            };
            
            eventSourceRef.current.addEventListener('complete', () => {
                if (parserRef.current) {
                    parserRef.current.stopStreaming();
                }
                
                setIsLoading(false);
                eventSourceRef.current?.close();
            });

        } catch (error: any) {
            setError(error);
            setIsLoading(false);
        }
    }, [editorView]);

    const stopStreaming = useCallback(() => {
        if (parserRef.current) {
            parserRef.current.stopStreaming();
        }
        
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