import { useCallback, useRef, useState } from "react";
import { extendedProseMirrorSchema, useEditor } from "@/providers/editor-context-provider";
import { IncrementalProsemirrorRenderer } from "@/lib/incremental-prosemirror-renderer";
import type { ChatMode } from "@/types/messages";
import { ChatModeIncrementalParser } from "@/lib/chat-mode-parser";
import { ComposerModeParser, Tags } from "@/lib/composer-mode-parser";
import { useChatStore } from "@/store/chat";

export const useSSEStream = () => {
    const [content, setContent] = useState<string>("");
    const chatMode = useChatStore(state => state.currentChatMode)
    console.log("CHAT MODE CHANGED in use sse: ", chatMode)
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStreamId, setCurrentStreamId] = useState<string>("")
    const { editorView } = useEditor();
    
    const chatParserRef = useRef<ChatModeIncrementalParser | null>(null);
    const composerParserRef = useRef<ComposerModeParser | null>(null)
    const rendererRef = useRef<IncrementalProsemirrorRenderer | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const getCurrentParser = () => {
        if(chatMode === "CHAT"){
            return chatParserRef
        } else {
            return composerParserRef
        }
    }

    const startStreaming = useCallback(async (chatMode: ChatMode, prompt: string, sendTokensCallback: (token: string) => void) => {

        try {

            setIsStreaming(true);
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
        

            if(!chatParserRef.current && rendererRef.current){
                chatParserRef.current = new ChatModeIncrementalParser(sendTokensCallback)
            }

            if(!composerParserRef.current && rendererRef.current){
                composerParserRef.current = new ComposerModeParser({
                    sendTokensCallback: (tokens: string) => sendTokensCallback(tokens),
                    onOpenTag: (tag: Tags) => rendererRef.current?.onOpenTag(tag),
                    onCloseTag: (tag: Tags) => rendererRef.current?.onCloseTag(tag),
                    onTextContent: (text: Tags) => rendererRef.current?.onTextContent(text)
                })
            }

            // if (!parserRef.current && rendererRef.current) {
            //     if(chatMode === "CHAT"){
            //         parserRef.current = new ChatModeIncrementalParser(sendTokensCallback)
            //     } else if(chatMode === "COMPOSER") {

            //     } else {

            //     }
            //     parserRef.current = new IncrementalParser(chatMode, {
            //         sendTokensCallback: (tokens: string) => sendTokensCallback(tokens),
            //         onOpenTag: (tag) => rendererRef.current?.onOpenTag(tag),
            //         onCloseTag: (tag) => rendererRef.current?.onCloseTag(tag),
            //         onTextContent: (text) => rendererRef.current?.onTextContent(text)
            //     });
            // }



            // Initialize stream
            const response = await fetch("http://localhost:3007/api/generate/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt, chatMode: chatMode })
            });

            if (!response.ok) {
                throw new Error("Failed to initialize stream!");
            }

            const { streamId } = await response.json();
            setCurrentStreamId(streamId)
            
            // Setup SSE
            eventSourceRef.current = new EventSource(
                `http://localhost:3007/api/generate/stream/${streamId}`
            );

            // Handle messages
            eventSourceRef.current.onmessage = (event) => {
                const token = event.data;

                console.log("CURRENT PARSER IS: ", getCurrentParser())

                switch (token.trim()) {
                    case "[DONE]":
                    case "END_STREAM":
                        getCurrentParser()?.current.stopStreaming();
                        setIsStreaming(false);
                        eventSourceRef.current?.close();
                        return;
                        
                    case "START_STREAM":
                        getCurrentParser()?.current.startStreaming();
                        return;
                        
                    default:
                        const decodedToken = token.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
                        setContent(prev => prev + decodedToken);
                        getCurrentParser()?.current.processChunk(decodedToken);
                }
            };

            // Handle errors
            eventSourceRef.current.onerror = (err) => {
                console.error("SSE Error:", err);
                setError(new Error("Stream error occurred"));
                getCurrentParser()?.current.stopStreaming();
                eventSourceRef.current?.close();
                setIsStreaming(false);
            };

        } catch (error: any) {
            setError(error);
            setIsStreaming(false);
        }
    }, [editorView, chatMode]);

    const stopStreaming = useCallback(() => {
        getCurrentParser().current?.stopStreaming();
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        
        setIsStreaming(false);
        setContent("");
    }, []);

    return { 
        content,
        isStreaming, 
        error,
        startStreaming,
        stopStreaming,
        currentStreamId,
        setCurrentStreamId
    };
};