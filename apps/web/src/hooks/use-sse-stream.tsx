import { useCallback, useRef, useState } from "react";
import {
  extendedProseMirrorSchema,
  useEditor,
} from "@/providers/editor-context-provider";
import { IncrementalProsemirrorRenderer } from "@/lib/incremental-prosemirror-renderer";
import type { ChatMode } from "@/types/messages";
import { ChatModeIncrementalParser } from "@/lib/chat-mode-parser";
import {
  ComposerModeParser,
  type CodeBlockNodeType,
} from "@/lib/composer-mode-parser";
import { useChatStore } from "@/store/chat";
import { FingerprintManager } from "@/lib/fingerprint-manager";
import type { Node } from "prosemirror-model";
import { EditorActionsManager } from "@/lib/editor-actions-manager";
import { TextSelection } from "prosemirror-state";
import { Tags } from "@/types/editor";

console.log("OKay so all the envs are: ", import.meta.env)

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"

export const useSSEStream = () => {
  const [content, setContent] = useState<string>("");
  const chatMode = useChatStore((state) => state.currentChatMode);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string>("");
  const { editorView, setAcceptRejectDialog } = useEditor();
  const { setCurrentLLMAction} = useChatStore()

  const editorActionsManagerRef = useRef<EditorActionsManager | null>(null);
  const userInteractedRef = useRef<boolean>(false);
  const fingerprintManagerRef = useRef<FingerprintManager | null>(null);
  const chatParserRef = useRef<ChatModeIncrementalParser | null>(null);
  const composerParserRef = useRef<ComposerModeParser | null>(null);
  const rendererRef = useRef<IncrementalProsemirrorRenderer | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const getCurrentParser = () => {
    if (chatMode === "CHAT") {
      return chatParserRef;
    } else {
      return composerParserRef;
    }
  };

  const startStreaming = useCallback(
    async (
      chatMode: ChatMode,
      prompt: string,
      sendTokensCallback: (token: string) => void
    ) => {
      console.log("Inside start streaming");
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
            extendedProseMirrorSchema,
            fingerprintManagerRef.current!
          );

          editorActionsManagerRef.current = new EditorActionsManager(
            editorView.current,
            extendedProseMirrorSchema
          );
        }

        if (!chatParserRef.current && rendererRef.current) {
          chatParserRef.current = new ChatModeIncrementalParser(
            sendTokensCallback
          );
        }

        if (!composerParserRef.current && rendererRef.current) {
          fingerprintManagerRef.current = new FingerprintManager(
            editorView.current!
          );

          composerParserRef.current = new ComposerModeParser({
            sendJsonNode: async (node: string) => await insertAfterThisNode(node),
            sendNodeToDelete: (node: string) => deleteNode(node),
            sendTokensCallback: (tokens: string) => sendTokensCallback(tokens),
            sendCodeBlockNode: (codeBlock: CodeBlockNodeType) =>
              rendererRef.current!.onCodeBlock(codeBlock),
            onOpenTag: (tag: Tags) => rendererRef.current?.onOpenTag(tag),
            onCloseTag: (tag: Tags) => rendererRef.current?.onCloseTag(tag),
            onTextContent: (text: string) =>
              rendererRef.current?.onTextContent(text),
            setCurrentActionState(action) {
              setCurrentLLMAction(action)
            },
          });
        }
        function findFirstParagraphContentPosition(node: Node): number | null {
          let firstParagraphPos: number | null = null;

          node.descendants((node, pos) => {
            if (node.type.name === "paragraph" && node.content.size > 0) {
              firstParagraphPos = pos + 1;
              return false;
            }
          });
          return firstParagraphPos;
        }

        const deleteNode = (nodeHash: string) => {
          if(!fingerprintManagerRef.current || !editorView.current) return

          fingerprintManagerRef.current.generateEditorNodesFingerprints(
            editorView.current
          );

          const matchedNode =
            fingerprintManagerRef.current.matchFingerprint(nodeHash);

          console.log("DELETION NODE MATCHED:", matchedNode);

          if (matchedNode && editorView.current) {
            const { state } = editorView.current;
            let tr = state.tr;

            const nodePos = matchedNode.startPos;
            const originalNode = state.doc.nodeAt(nodePos);

            if (originalNode) {
              const deletionSuggestion =
                state.schema.nodes.deletion_suggestion.create(
                  {
                    id: `deletion-${Date.now()}`,
                    originalNodeType: originalNode.type.name,
                    originalAttrs: JSON.stringify(originalNode.attrs),
                  },
                  originalNode
                );

              // 4. Replace the original node with the deletion suggestion
              tr.setSelection(TextSelection.create(editorView.current.state.doc, nodePos))
              tr.scrollIntoView()
              const updatedTr = tr.replaceWith(
                nodePos,
                nodePos + originalNode.nodeSize,
                deletionSuggestion
              );

              const mappedPositionAfterDeletion = updatedTr.mapping.map(nodePos);

              let scrollTargetPosition = mappedPositionAfterDeletion;

              const testPos = findFirstParagraphContentPosition(
                matchedNode.node
              );

              if (testPos !== null) {
                console.log(
                  "DEBUG SCROLL TEST: Found first paragraph content at position:",
                  testPos
                );

                scrollTargetPosition = testPos;

                console.log(
                  `DEBUG SCROLL TEST: Using test position ${scrollTargetPosition} for scrolling.`
                );
              } else {
                console.log(
                  "DEBUG SCROLL TEST: Could not find a paragraph content position for test. Using mapped deletion position."
                );
              }

              tr = tr.setSelection(
                TextSelection.create(tr.doc, scrollTargetPosition)
              );

              tr = tr.scrollIntoView();

              editorView.current.dispatch(tr);

              const nextInsertionPos = tr.mapping.map(
                nodePos + originalNode.nodeSize
              );
              rendererRef.current!.setInsertionPoint(nextInsertionPos);
            } else {
              console.warn(
                "Attempted to delete node with hash",
                nodeHash,
                "but could not find it in the document at original pos",
                nodePos
              );
            }
          } else {
            console.warn(
              "Attempted to delete node with hash",
              nodeHash,
              "but no match found in the document."
            );
          }
        };



        const editorDocNodes = editorView.current!.state.doc.content;
        const validContentNodes: {id: string, content: {type: string, content: string}}[] = [];
        fingerprintManagerRef.current!.clearHashCollisionCounter()
        editorDocNodes.content.forEach((node: Node) => {
          console.log("NODE is: ", node)
          // if (node.content.size > 0) {
            const content = fingerprintManagerRef.current!.normalizeNodeTextContent(node);
            const hash = fingerprintManagerRef.current!.getUniqueHash(content);
            const contentNode = {
              type: node.type.name,
              content: node.textContent
            };
            validContentNodes.push({ id: hash, content: contentNode });
          // }
        });

        console.log("CONTENT NODESSSSSSSS: ", validContentNodes);

        async function insertAfterThisNode(nodeHash: string) {
          fingerprintManagerRef.current!.clearHashCollisionCounter()
          console.log("ADD NODE found so generating hashes for editor content")
          fingerprintManagerRef.current!.generateEditorNodesFingerprints(
            editorView.current!
          );
          const matchedNode =
            fingerprintManagerRef.current!.matchFingerprint(nodeHash);
          console.log("ADDITION NODE FOUND IS: ", matchedNode);
          if (matchedNode) {
            rendererRef.current!.setInsertionPoint(matchedNode.insertPosition);
          } else {
            // todo: need smart and intelligent fallback method to partial match the node
            // fallback to document size
            const insertPos = editorView.current!.state.doc.content.size
            rendererRef.current!.setInsertionPoint(insertPos)
          }
        }


        // Initialize stream
        const response = await fetch(
          `${BASE_URL}/api/init/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: prompt,
              chatMode: chatMode,
              contentNodes: validContentNodes,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to initialize stream!");
        }

        const { streamId } = await response.json();
        setCurrentStreamId(streamId);

        // Setup SSE
        eventSourceRef.current = new EventSource(
          `${BASE_URL}/api/generate/stream?streamID=${streamId}`
        );

        function preProcessIncomingTokens(tokens: string){
          return tokens.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
        }

        // Handle messages
        eventSourceRef.current.onmessage = (event) => {
          const tokens = event.data;

          console.log("CURRENT PARSER IS: ", getCurrentParser());
          console.log("TOKEN IS: ", tokens);

          switch (tokens.trim()) {
            case "[DONE]":
            case "END_STREAM":
              getCurrentParser()?.current!.stopStreaming();
              rendererRef.current!.updateSuccessfulGenerations();
              setIsStreaming(false);
              eventSourceRef.current!.close();
              if (window.suggestionsManager!.totalEdits() > 0) {
                setAcceptRejectDialog(true);
              }
              return;

            case "START_STREAM":
              getCurrentParser()?.current!.startStreaming();

              if (editorView.current!.state.doc.textContent.trim().length === 0) {
                rendererRef.current!.setHighlight(false);
              } else {
                rendererRef.current!.setHighlight(true);
              }

              return;

            default:
              setContent((prev) => prev + preProcessIncomingTokens(tokens));
              getCurrentParser()?.current!.processChunk(preProcessIncomingTokens(tokens));
          }
        };

        // Handle errors
        eventSourceRef.current!.onerror = (err) => {
          console.error("SSE Error:", err);
          setError(new Error("Stream error occurred"));
          getCurrentParser()?.current!.stopStreaming();
          eventSourceRef.current!.close();
          setIsStreaming(false);
        };
      } catch (error: unknown) {
        if(error instanceof Error){
          setError(error);
        }
        setIsStreaming(false);
      }
    },
    [editorView, chatMode]
  );

  const stopStreaming = useCallback(() => {
    getCurrentParser().current!.stopStreaming();
    rendererRef.current!.cleanupAfterStreamStop();
    if (eventSourceRef.current!) {
      eventSourceRef.current!.close();
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
    userInteractedRef,
    fingerprintManagerRef
  };
};
