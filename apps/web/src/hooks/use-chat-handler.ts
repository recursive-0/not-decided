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

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef(null);
  const streamingMessageId = useRef(null);
  const scrollAreaRef = useRef(null);

  const { startStreaming, stopStreaming, isStreaming, currentStreamId } =
    useSSEStream();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      const newHeight = Math.max(
        38,
        Math.min(150, textareaRef.current.scrollHeight)
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

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

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || input.trim();

    if (textToSend && !isStreaming) {
      if (!messageText) {
        setInput("");

        if (textareaRef.current) {
          textareaRef.current.style.height = "38px";
        }
      }

      const userMessageId = uuidv4();
      addChatMessage({
        id: userMessageId,
        role: "user",
        content: textToSend,
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
        startStreaming(currentChatMode, textToSend, handleTokenReceived);
        setIsThinking(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTabChange = (value: ChatMode) => {
    setCurrentChatMode(value);
  };

  const handleSelectionQuery = (selectedText: string, prompt: string) => {
    const contextualPrompt = `${prompt} for the following text: "${selectedText}"`;
    handleSendMessage(contextualPrompt);
  };

  return {
    input,
    setInput,
    isThinking,
    isStreaming,
    chatMessages,
    currentChatMode,

    textareaRef,
    scrollAreaRef,

    handleSendMessage,
    handleKeyDown,
    handleTabChange,
    handleSelectionQuery,

    setCurrentChatMode,
  };
};
