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
  CurrentActionType,
  type CodeBlockNodeType,
} from "@/lib/composer-mode-parser";
import { useChatStore } from "@/store/chat";
import { FingerprintManager } from "@/lib/fingerprint-manager";
import { EditorActionsManager } from "@/lib/editor-actions-manager";
import { OperationType, Tags } from "@/types/editor";
import {
  SuggestionHighlightMetaDataType,
  suggestionHighlightPluginKey,
} from "@/plugins/suggestion-highlight-plugin";
import { getContentNodes } from "@/lib/misc-editor-helpers";
import { suggestionNavigatorPluginKey } from "@/plugins/suggestion-navigator-plugin";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export const useSSEStream = () => {
  const [content, setContent] = useState<string>("");
  const chatMode = useChatStore((state) => state.currentChatMode);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string>("");
  const { editorView } = useEditor();
  const { setCurrentLLMAction } = useChatStore();

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

  const executeOperation = useCallback(
    (operationData: OperationType) => {
      if (!editorView.current) return;

      const { action, nodeIds } = operationData;

      if (action === "delete") {
        const currentTr = editorView.current.state.tr
        nodeIds.forEach((id) => {
          if (!editorView.current) return;
          const metaForPlugin: SuggestionHighlightMetaDataType = {
            metaData: {
              type: "deletion-suggestion",
              nodeId: id,
            },
          };
          currentTr.setMeta(suggestionHighlightPluginKey, metaForPlugin);
          editorView.current.dispatch(currentTr);
        });
        return;
      }

      if (action === "add") {
        const nodeId = nodeIds[0];
        if (!nodeId) return;

        if (rendererRef.current) {
          editorView.current.state.doc.descendants((node, pos) => {
            if (nodeId === node.attrs.nodeId) {
              const endPos = pos + node.nodeSize;
              rendererRef.current!.setInsertionPoint(endPos);
              return false;
            }
          });
        }
        return;
      }

      if (action === "replace") {
        const nodeId = nodeIds[0];
        if (!nodeId || !editorView.current) return;

        const currentTr = editorView.current.state.tr;

        const deleteNodeMetadata: SuggestionHighlightMetaDataType = {
          metaData: {
            type: "deletion-suggestion",
            nodeId: nodeId,
          },
        };
        currentTr.setMeta(suggestionHighlightPluginKey, deleteNodeMetadata);
        editorView.current.dispatch(currentTr);

        if (rendererRef.current) {
          editorView.current.state.doc.descendants((node, pos) => {
            if (nodeId === node.attrs.nodeId) {
              const endPos = pos + node.nodeSize;
              rendererRef.current!.setInsertionPoint(endPos);
              return false;
            }
          });
        }
        return;
      }
    },
    [editorView, rendererRef]
  );

  const startStreaming = useCallback(
    async (
      chatMode: ChatMode,
      prompt: string,
      sendTokensCallback: (token: string) => void
    ) => {
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
            onOperation(operation) {
              executeOperation(operation);
            },
            sendTokensCallback: (tokens: string) => sendTokensCallback(tokens),
            sendCodeBlockNode: (codeBlock: CodeBlockNodeType) =>
              rendererRef.current!.onCodeBlock(codeBlock),
            onOpenTag: (tag: Tags) => rendererRef.current?.onOpenTag(tag),
            onCloseTag: (tag: Tags) => rendererRef.current?.onCloseTag(tag),
            onTextContent: (text: string) =>
              rendererRef.current?.onTextContent(text),
            setCurrentActionState(action) {
              setCurrentLLMAction(action);
            },
          });
        }

        const validContentNodes = getContentNodes(editorView.current)


        // Initialize stream
        const response = await fetch(`${BASE_URL}/api/init/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt,
            chatMode: chatMode,
            contentNodes: validContentNodes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initialize stream!");
        }

        const { streamId } = await response.json();
        setCurrentStreamId(streamId);

        // Setup SSE
        eventSourceRef.current = new EventSource(
          `${BASE_URL}/api/generate/stream?streamID=${streamId}`
        );

        function preProcessIncomingTokens(tokens: string) {
          return tokens
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
        }

        // Handle messages
        eventSourceRef.current.onmessage = (event) => {
          const tokens = event.data;


          switch (tokens.trim()) {
            case "[DONE]":
            case "END_STREAM":
              getCurrentParser()?.current!.stopStreaming();
              rendererRef.current!.updateSuccessfulGenerations();
              setIsStreaming(false);
              setCurrentLLMAction(CurrentActionType.NORMAL);
              eventSourceRef.current!.close();
              return;

            case "START_STREAM":
              getCurrentParser().current!.startStreaming();
              setCurrentLLMAction(CurrentActionType.NORMAL);
              editorView.current!.state.tr.setMeta(suggestionNavigatorPluginKey, { navigateToIndex: null, action: "reset"})
              return;

            default:
              setContent((prev) => prev + preProcessIncomingTokens(tokens));
              getCurrentParser()?.current!.processChunk(
                preProcessIncomingTokens(tokens)
              );
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
        if (error instanceof Error) {
          setError(error);
        }
        setIsStreaming(false);
      }
    },
    [editorView, chatMode]
  );

  const stopStreaming = () => {
    getCurrentParser().current!.stopStreaming();
    rendererRef.current!.cleanupAfterStreamStop();
    if (eventSourceRef.current!) {
      eventSourceRef.current!.close();
      eventSourceRef.current = null;
    }

    setIsStreaming(false);
    setContent("");
  };

  return {
    content,
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    currentStreamId,
    setCurrentStreamId,
    userInteractedRef,
    fingerprintManagerRef,
  };
};
