import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useChatStore } from "@/store/chat";
import { useEditor } from "@/providers/editor-context-provider";
import type { ChatMode } from "@/types/messages";

export const useChatHandler = () => {
  const chatMessages = useChatStore((state) => state.chatMessages);
  const addChatMessage = useChatStore((state) => state.addChatMessage);
  const currentChatMode = useChatStore((state) => state.currentChatMode);
  const setCurrentChatMode = useChatStore((state) => state.setCurrentChatMode);
  const appendTokenToMessage = useChatStore(
    (state) => state.appendTokenToLastMessage
  );

  const { insertTextAtCursor, isEditorReady } = useEditor();

  const [isThinking, setIsThinking] = useState(false);
  const streamingMessageId = useRef(null);

  const scrollAreaRef = useRef(null);

  const { startStreaming, stopStreaming, isStreaming, currentStreamId } =
    useSSEStream();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [chatMessages, isThinking]);

  const handleTokenReceived = (token: string) => {
    if (currentChatMode === "COMPOSER" && isEditorReady) {
      appendTokenToMessage(token);
    } else if (currentChatMode === "CHAT" && streamingMessageId.current) {
      appendTokenToMessage(token);
    }
  };

  const handleSendMessage = (messageText: string) => {

      const userMessageId = uuidv4();
      addChatMessage({
        id: userMessageId,
        role: "user",
        content: messageText,
      });

      setIsThinking(true);

      const llmMessageId = uuidv4();

      setTimeout(() => {
        addChatMessage({
          id: llmMessageId,
          role: "echo",
          content: "",
        });

        streamingMessageId.current = llmMessageId;
        startStreaming(currentChatMode, messageText, handleTokenReceived);
        setIsThinking(false);
      }, 1000);
    }


  const handleTabChange = (value: ChatMode) => {
    setCurrentChatMode(value);
  };

  const handleSelectionQuery = (selectedText: string, prompt: string) => {
    const contextualPrompt = `${prompt} for the following text: "${selectedText}"`;
    handleSendMessage(contextualPrompt);
  };

  return {
    isThinking,
    isStreaming,
    stopStreaming,
    chatMessages,
    currentChatMode,
    scrollAreaRef,
    handleSendMessage,
    setCurrentChatMode,
    handleSelectionQuery,
  };
};
