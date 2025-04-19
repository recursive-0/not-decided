import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useChatStore } from "@/store/chat";
import { useEditor } from "@/providers/editor-context-provider";
import { useEditorStore } from "@/store/editor";

export const useChatHandler = () => {
  const chatMessages = useChatStore((state) => state.chatMessages);
  const addChatMessage = useChatStore((state) => state.addChatMessage);
  const currentChatMode = useChatStore((state) => state.currentChatMode);
  const setCurrentChatMode = useChatStore((state) => state.setCurrentChatMode);
  const { totalCurrentEdits } = useEditorStore();
  const appendTokenToMessage = useChatStore(
    (state) => state.appendTokenToLastMessage
  );

  const { isEditorReady } = useEditor();

  const [isThinking, setIsThinking] = useState(false);
  const [isPendingChangesPopupOpen, setPendingChangesPopup] =
    useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const streamingMessageId = useRef<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const { startStreaming, stopStreaming, isStreaming, currentStreamId } =
    useSSEStream();

  const scrollToBottom = useCallback(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (scrollViewport && autoScroll) {
      scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }
  }, [autoScroll, scrollAreaRef]);

  const handleTokenReceived = (token: string) => {
    if (currentChatMode === "COMPOSER" && isEditorReady) {
      appendTokenToMessage(token);
    } else if (currentChatMode === "CHAT" && streamingMessageId.current) {
      appendTokenToMessage(token);
    }

    scrollToBottom();
  };

  const handleSendMessage = (messageText: string) => {
    if (totalCurrentEdits > 0) {
      setPendingChangesPopup(true);
      return;
    }

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

      const scrollViewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLDivElement | null;

      if (scrollViewport) {
        const scrollBottom = scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight;
        if (scrollBottom < 30) {
          setAutoScroll(true);
        }
      }

      startStreaming(currentChatMode, messageText, handleTokenReceived);

      setIsThinking(false);
    }, 100);
  };

  const handleSelectionQuery = (selectedText: string, prompt: string) => {
    if (totalCurrentEdits > 0) {
      setPendingChangesPopup(true);
      return;
    }
    const contextualPrompt =
      selectedText.length > 0
        ? `${prompt} for the following text: "${selectedText}"`
        : `${prompt}`;
    handleSendMessage(contextualPrompt);
  };

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (scrollViewport) {
      const handleScroll = () => {
        const scrollBottom = scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight;
        
        if (scrollBottom > 30) {
          setAutoScroll(false);
        } else if (scrollBottom < 5) {
          setAutoScroll(true);
        }
      };

      scrollViewport.addEventListener("scroll", handleScroll);

      return () => {
        scrollViewport.removeEventListener("scroll", handleScroll);
      };
    }

    return () => {};
  }, [scrollAreaRef, setAutoScroll]);

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
    isPendingChangesPopupOpen,
    setPendingChangesPopup,
    setAutoScroll,
    autoScroll,
  };
};