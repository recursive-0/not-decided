import { useSSEStream } from "@/hooks/use-sse-stream";
import { useEditor } from "@/providers/editor-context-provider";
import { useChatStore } from "@/store/chat";
import { useWrisorStore } from "@/store/wrisor";
import { ChatMode, Message } from "@/types/messages";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";

interface ChatHandlerContextType {
  isThinking: boolean;
  isStreaming: boolean;
  stopStreaming: () => void;
  chatMessages: Message[];
  currentChatMode: string;
  registerScrollAreaRef: (element: HTMLDivElement | null) => void;
  handleSendMessage: (messageText: string) => void;
  setCurrentChatMode: (mode: ChatMode) => void;
  handleSelectionQuery: (selectedText: string, prompt: string) => void;
  isPendingChangesPopupOpen: boolean;
  setPendingChangesPopup: (isOpen: boolean) => void;
  totalCurrentEdits: number;
}

const ChatHandlerContext = createContext<ChatHandlerContextType | null>(null);

interface ChatHandlerProviderProps {
  children: ReactNode;
}

export const ChatHandlerProvider: React.FC<ChatHandlerProviderProps> = ({
  children,
}) => {
  const {chatMessages, addChatMessage, currentChatMode, setCurrentChatMode} = useChatStore()
  const { totalCurrentEdits } = useWrisorStore();
  const appendTokenToMessage = useChatStore(
    (state) => state.appendTokenToLastMessage
  );

  const { isEditorReady } = useEditor();

  const [isThinking, setIsThinking] = useState(false);
  const [isPendingChangesPopupOpen, setPendingChangesPopup] =
    useState<boolean>(false);
  const autoScrollRef = useRef<boolean>(true);
  const streamingMessageId = useRef<string | null>(null);

  const [scrollAreaElement, setScrollAreaElement] =
    useState<HTMLDivElement | null>(null);

  const { startStreaming, stopStreaming, isStreaming } = useSSEStream();

  const registerScrollAreaRef = useCallback(
    (element: HTMLDivElement | null) => {
      setScrollAreaElement(element);
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    const scrollViewport = scrollAreaElement?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;


    if (scrollViewport && autoScrollRef.current) {
      requestAnimationFrame(() => {
        if (autoScrollRef.current && scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
      });
    }
  }, [scrollAreaElement]);

  const handleTokenReceived = useCallback(
    (token: string) => {
      if (currentChatMode === "COMPOSER" && isEditorReady) {
        appendTokenToMessage(token);
      } else if (currentChatMode === "CHAT" && streamingMessageId.current) {
        appendTokenToMessage(token);
      }
      scrollToBottom();
    },
    [currentChatMode, isEditorReady, appendTokenToMessage, scrollToBottom]
  );

  const handleSendMessage = useCallback(
    (messageText: string) => {
      autoScrollRef.current = true;

      if (totalCurrentEdits > 0) {
        setPendingChangesPopup(true);
        return;
      }

      const userMessageId = uuidv4();
      addChatMessage({ id: userMessageId, role: "user", content: messageText });

      setIsThinking(true);

      const llmMessageId = uuidv4();
      addChatMessage({ id: llmMessageId, role: "echo", content: "" });
      streamingMessageId.current = llmMessageId;

      startStreaming(currentChatMode, messageText, handleTokenReceived);
      setIsThinking(false);
    },
    [
      totalCurrentEdits,
      addChatMessage,
      currentChatMode,
      handleTokenReceived,
      startStreaming,
    ]
  );

  const handleSelectionQuery = useCallback(
    (selectedText: string, prompt: string) => {

      //
      if (totalCurrentEdits > 0) {
        setPendingChangesPopup(true);
        return;
      }
      const contextualPrompt =
        selectedText.length > 0
          ? `${prompt} for the following text: "${selectedText}"`
          : `${prompt}`;
      handleSendMessage(contextualPrompt);
    },
    [totalCurrentEdits, handleSendMessage]
  );

  useEffect(() => {
   
    if (autoScrollRef.current) {
      scrollToBottom();
    }
  }, [chatMessages.length, scrollToBottom]);

  useEffect(() => {
    const scrollViewport = scrollAreaElement?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (scrollViewport) {
      const handleScroll = () => {
        const isNearBottom =
          scrollViewport.scrollHeight -
            scrollViewport.scrollTop -
            scrollViewport.clientHeight <
          50;
        if (!isNearBottom) {
          if (autoScrollRef.current) {
            
            autoScrollRef.current = false;
          }
        }
      };

      scrollViewport.addEventListener("touchstart", handleScroll);
      scrollViewport.addEventListener("wheel", handleScroll);

      return () => {
        scrollViewport.removeEventListener("touchstart", handleScroll);
        scrollViewport.removeEventListener("wheel", handleScroll);
      };
    }
    return () => {};
  }, [scrollAreaElement]);

  const value: ChatHandlerContextType = {
    isThinking,
    isStreaming,
    stopStreaming,
    chatMessages,
    currentChatMode,
    registerScrollAreaRef,
    handleSendMessage,
    setCurrentChatMode,
    handleSelectionQuery,
    isPendingChangesPopupOpen,
    setPendingChangesPopup,
    totalCurrentEdits,
  };

  return (
    <ChatHandlerContext.Provider value={value}>
      {children}
    </ChatHandlerContext.Provider>
  );
};

export const useChatHandler = (): ChatHandlerContextType => {
  const context = useContext(ChatHandlerContext);
  if (context === null) {
    throw new Error("useChatHandler must be used within a ChatHandlerProvider");
  }
  return context;
};
