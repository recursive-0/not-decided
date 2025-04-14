import { useCallback, useRef, useState } from "react";
import { extendedProseMirrorSchema, useEditor } from "@/providers/editor-context-provider";
import { IncrementalProsemirrorRenderer } from "@/lib/incremental-prosemirror-renderer";
import type { ChatMode } from "@/types/messages";
import { ChatModeIncrementalParser } from "@/lib/chat-mode-parser";
import { ComposerModeParser } from "@/lib/composer-mode-parser";
import { useChatStore } from "@/store/chat";
import { FingerprintManager } from "@/lib/fingerprint-manager";
import type { Node } from "prosemirror-model";

export enum Tags {
    "H1" = "H1",
    "H2" = "H2",
    "H3" = "H3",
    "P" = "P",
    "B" = "B",
    "I" = "I",
    "UL" = "UL",
    "OL" = "OL",
    "LI" = "LI",
    "CODE" = "CODE",
    "ICODE" = "ICODE",
    "QUOTE" = "QUOTE",
    "CHECKBOX" = "CHECKBOX",
  }


export const useSSEStream = () => {
    const [content, setContent] = useState<string>("");
    const chatMode = useChatStore(state => state.currentChatMode)
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStreamId, setCurrentStreamId] = useState<string>("")
    const { editorView } = useEditor();
    
    const userInteractedRef = useRef<boolean>(false)
    const fingerprintManagerRef = useRef<FingerprintManager | null>(null)
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
        console.log("Inside start streaming")
        userInteractedRef.current = false;
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

                fingerprintManagerRef.current = new FingerprintManager(editorView.current)

                composerParserRef.current = new ComposerModeParser({
                    sendJsonNode: async (node: string) => await checkFingerprints(node),
                    sendNodeToDelete: (node: string) => deleteNode(node),
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

            const deleteNode = (node: string) => {
                const hash = fingerprintManagerRef.current.fastHash(node);
                const matchedNode = fingerprintManagerRef.current.matchFingerprint(hash);
                
                if (matchedNode && editorView.current) {
                    const { state } = editorView.current;
                    const { tr } = state;
                    
                    const nodePos = matchedNode.startPos;
                    const originalNode = state.doc.nodeAt(nodePos);
                    
                    if (originalNode) {
                        const deletionSuggestion = state.schema.nodes.deletion_suggestion.create(
                            {
                                id: `deletion-${Date.now()}`, // Generate a unique ID
                                originalNodeType: originalNode.type.name,
                                originalAttrs: JSON.stringify(originalNode.attrs)
                            },
                            originalNode
                        );
                        
                        // 4. Replace the original node with the deletion suggestion
                        const updatedTr = tr.replaceWith(
                            nodePos, 
                            nodePos + originalNode.nodeSize, 
                            deletionSuggestion
                        );
                        
                        // 5. Apply the transaction
                        editorView.current.dispatch(updatedTr);

                        const nextInsertionPos = tr.mapping.map(nodePos + originalNode.nodeSize);
                        rendererRef.current.setInsertionPoint(nextInsertionPos);
                    }
                }
            };

            const editorDocNodes = editorView.current.state.doc.toJSON()
            const contentNodes = editorDocNodes.content.map((node: Node) => {
                return {
                    type: node.type,
                    content: node.content
                }
            })

            async function checkFingerprints(node: string){
                fingerprintManagerRef.current.generateEditorNodesFingerprints(editorView.current)
                console.log("LLM FINGERPRINT NODE: ", node)
                const normalizedNode = node.normalize().toLowerCase()
                console.log("LLM noramlized fingerprint node: ", normalizedNode)
                const hash = fingerprintManagerRef.current.fastHash(normalizedNode)
                const matchedNode = fingerprintManagerRef.current.matchFingerprint(hash)
                console.log("FOUND IS: ", matchedNode)
                if(matchedNode){
                    rendererRef.current.setInsertionPoint(matchedNode.position)
                }
            }

            // Initialize stream
            const response = await fetch("http://localhost:4000/api/generate/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt, chatMode: chatMode, contentNodes: contentNodes})
            });

            if (!response.ok) {
                throw new Error("Failed to initialize stream!");
            }

            const { streamId } = await response.json();
            setCurrentStreamId(streamId)
            
            // Setup SSE
            eventSourceRef.current = new EventSource(
                `http://localhost:4000/api/generate/stream/${streamId}`
            );

            // Handle messages
            eventSourceRef.current.onmessage = (event) => {
                const token = event.data;

                console.log("CURRENT PARSER IS: ", getCurrentParser())

                switch (token.trim()) {
                    case "[DONE]":
                    case "END_STREAM":
                        getCurrentParser()?.current.stopStreaming();
                        rendererRef.current.updateSuccessfulGenerations()
                        setIsStreaming(false);
                        eventSourceRef.current?.close();
                        return;
                        
                        case "START_STREAM":
                            getCurrentParser()?.current.startStreaming();
                            
                            // Check if editor is empty
                            const docContent = editorView.current.state.doc;
                            const isEmpty = docContent.textContent.trim().length === 0;
                            
                            console.log("EDITOR EMPTY STATUS:", isEmpty, "Text length:", docContent.textContent.length);
                            
                            if (isEmpty) {
                                rendererRef.current.setHighlight(false);
                            } else {
                                rendererRef.current.setHighlight(true);
                            }
                            
                            rendererRef.current.setMode(chatMode);
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
        rendererRef.current.cleanupAfterStreamStop()
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
        setCurrentStreamId,
        userInteractedRef
    };
};