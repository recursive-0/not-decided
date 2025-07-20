import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CornerDownLeft, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { cn } from "@/lib/utils";
import { useEditor } from "@/providers/editor-context-provider";
import { useWrisorStore } from "@/store/wrisor";
import { WrisorLogo } from "@/svg/wrisor-logo.svg";
import { ChatMode } from "@/types/messages";
import { Mode } from "@/types/stream";
import { ActionIndicator } from "./action-indicator";
import { ChatMessages } from "./chat-messages";
import { ChatModeEmptyContent } from "./chat-mode-empty-content";
import { ComposerModeEmptyContent } from "./composer-mode-empty-content";
import PendingChangesWarning from "./pending-changes-warning-popup";
import { SectionMentionDropdown } from "./section-mention-dropdown";
import PulseLoader from "@/components/loaders/pulse-loader/pulse-loader";

// Thinking loader component
const ThinkingLoader = () => {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-70"
        >
          <path
            d="M10 4.16667V4.17667"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.3333 6.66667V6.67667"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.66667 6.66667V6.67667"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.3333 13.3333V13.3433"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.66667 13.3333V13.3433"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 15.8333V15.8433"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm">Wrisor is thinking</span>
      </div>
    </div>
  );
};

const AIChat = () => {
  const {
    isThinking,
    isStreaming,
    stopStreaming,
    chatMessages,
    currentChatMode,
    setCurrentChatMode,
    // scrollAreaRef, <-- REMOVE this from destructuring
    registerScrollAreaRef, // <-- GET the registration function
    handleSendMessage,
    isPendingChangesPopupOpen,
    setPendingChangesPopup,
  } = useChatHandler();

  const { editorView } = useEditor();

  const localScrollAreaRef = useRef<HTMLDivElement | null>(null);

  const { totalCurrentEdits } = useWrisorStore();

  const [showSectionMention, setShowSectionMention] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const [input, setInput] = useState<string>("");
  const [showStreamingWarning, setShowStreamWarning] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Handle input changes to detect @ mentions
  const handleInputChange = (e) => {
    const target = e.target;
    const value = target.value;

    setInput(value);

    // Get cursor position safely
    const cursorPos = target.selectionStart || 0;

    // Check for @ at current cursor position
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // @ was just typed, show section mention
      setMentionStartIndex(lastAtIndex);

      setShowSectionMention(true);
    } else if (lastAtIndex !== -1 && cursorPos > lastAtIndex) {
      // Check if we're still in an @ mention
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
        // Space or newline found, close mention
        setShowSectionMention(false);
        setMentionStartIndex(-1);
      }
    } else {
      // No @ found or cursor moved away
      setShowSectionMention(false);
      setMentionStartIndex(-1);
    }
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = input.slice(0, mentionStartIndex);
    const afterMention = input.slice(mentionStartIndex + 1);
    const mentionText = `@${section.text}`;

    setInput(beforeMention + mentionText + afterMention);
    setShowSectionMention(false);
    setMentionStartIndex(-1);

    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor position after the mention
      const newCursorPos = beforeMention.length + mentionText.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Close section mention dropdown
  const closeSectionMention = () => {
    setShowSectionMention(false);
    setMentionStartIndex(-1);
  };

  const onStopStreaming = () => {
    console.log("Stop the stream");
    stopStreaming();
  };

  const onSendMessage = () => {
    if (isStreaming) {
      setShowStreamWarning(true);
      return;
    }

    if (totalCurrentEdits > 0) {
      setPendingChangesPopup(true);
      return;
    }

    handleSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      showSectionMention &&
      ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)
    ) {
      return; // Let SectionMentionDropdown handle these
    }

    // If streaming is active, show warning and prevent default behavior
    if (isStreaming) {
      e.preventDefault();
      setShowStreamWarning(true);
      return;
    }

    // If key is enter, allow normal behavior (newline)
    if (e.key === "Enter" && !e.shiftKey) {
      return; // Default behavior will insert a newline
    }

    // If key combination is Enter + Return, send the message and prevent newline
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isThinking) {
        if (totalCurrentEdits > 0) {
          setPendingChangesPopup(true);
          return;
        }
        handleSendMessage(input);
        setInput("");
      }
    }
  };

  const renderHeader = () => (
    <div className="border-b border-border bg-[var(--color-palette-beige-2)] flex-shrink-0">
      <div className="h-10 flex items-center px-3 py-1.5">
        <div className="flex items-center space-x-2">
          {/* <div className="w-6 h-6 rounded flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div> */}
          <TabsList className="h-auto border border-border rounded-sm bg-muted-foreground/10 p-0">
            <TabsTrigger
              value="CHAT"
              className="text-xs font-medium data-[state=active]:bg-white text-muted-foreground data-[state=active]:text-layer-7 rounded-sm data-[state=active]:shadow-sm"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="COMPOSER"
              className="text-xs font-medium data-[state=active]:bg-white text-muted-foreground data-[state=active]:text-layer-7 rounded-sm data-[state=active]:shadow-sm"
            >
              Composer
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );

  const renderInputArea = () => (
    <div className="p-2 flex-shrink-0 relative z-10">
      <div className="relative flex items-start">
        <div className={`absolute -top-7 left-1/2 -z-10 transform -translate-x-1/2 w-[95%] h-7 
          border-t border-x bg-white rounded-t-md transition-all duration-500 ease-in-out 
          ${isStreaming ? "opacity-100 -translate-x-1/2 translate-y-0" : "opacity-0 -translate-x-1/2 translate-y-7 invisible"}`}>
          <div className="w-full h-full flex items-center justify-between">
            <div className="w-full h-full flex items-center justify-start gap-2 relative px-2">
              <div className="w-6 h-6 relative">
                <WrisorLogo />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Wrisor is running
              </span>
            </div>
            <div className="w-full h-full flex items-center justify-end mr-2">
              <button className="w-4 h-4 relative rounded-full">
                <PulseLoader
                  color="oklch(39.6% 0.141 25.723)"
                  size={6}
                  spread={10}
                  shadowColor="oklch(44.4% 0.177 26.899)"
                />
              </button>
            </div>
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          placeholder="Ask anything (⌘k), @ to mention sections"
          className="flex-1 text-sm rounded-md resize-none border border-border
            text-muted-foreground placeholder:text-muted-foreground/80
            pr-8 py-2 min-h-[70px] max-h-[100px] overflow-y-scroll bg-transparent shadow-md 
            focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-border
            "
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e)}
          rows={1}
        />

        {isStreaming ? (
          <StreamingIndicator
            isStreaming={isStreaming}
            onStopStreaming={onStopStreaming}
          />
        ) : (
          <div
            className={cn(
              "absolute right-2 top-2 flex items-center justify-center w-6 h-6",
              isStreaming || isThinking || !input.trim()
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:text-destructive"
            )}
            onClick={() => {
              if (!isStreaming && !isThinking && input.trim()) {
                onSendMessage();
              }
            }}
            aria-label="Send message"
          >
            <CornerDownLeft className={`h-4 w-4 text-palette-dark`} />
          </div>
        )}

        <SectionMentionDropdown
          editorView={editorView}
          isVisible={showSectionMention}
          onSelect={handleSectionSelect}
          onClose={closeSectionMention}
        />

        {/* The warning message element */}
        <StreamingWarning
          visible={showStreamingWarning}
          onClose={() => setShowStreamWarning(false)}
        />

        <PendingChangesWarning
          visible={isPendingChangesPopupOpen}
          onClose={() => setPendingChangesPopup(false)}
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (localScrollAreaRef.current) {
      registerScrollAreaRef(localScrollAreaRef.current);
    }
  }, [registerScrollAreaRef]);

  useEffect(() => {
    if (!isStreaming) {
      setShowStreamWarning(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k") {
        const isModifierPressed = e.metaKey || e.ctrlKey;

        if (isModifierPressed) {
          e.preventDefault();

          // Focus the text area
          if (textareaRef.current) {
            textareaRef.current.focus();
            console.log("Cmd/Ctrl+K pressed, focusing textarea.");
          }
        }
      } else if (e.key.toLowerCase() === "m") {
        const isModifierPressed = e.metaKey || e.ctrlKey;

        if (isModifierPressed) {
          e.preventDefault();
          editorView.current!.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    if (localStorage.getItem("user_prompt")) {
      // send the message to the ai
      handleSendMessage(localStorage.getItem("user_prompt") || "");
      localStorage.removeItem("user_prompt");
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [textareaRef, editorView, handleSendMessage]);

  return (
    <div className="w-full flex flex-col h-full bg-border/15 text-[#073642]">
      <Tabs
        autoFocus
        value={currentChatMode}
        onValueChange={(value) => setCurrentChatMode(value as ChatMode)}
        className="flex flex-col h-full"
      >
        {renderHeader()}

        <div className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsContent
            value="CHAT"
            className="flex-1 flex flex-col p-0 m-0 overflow-hidden h-full"
          >
            <ScrollArea className="w-full flex-1 h-0" ref={localScrollAreaRef}>
              {chatMessages.length ? (
                <div className="px-2 min-w-0">
                  <ChatMessages messages={chatMessages} />
                  {isThinking && <ThinkingLoader />}
                </div>
              ) : (
                <ChatModeEmptyContent />
              )}
            </ScrollArea>
            {renderInputArea()}
          </TabsContent>

          <TabsContent
            value="COMPOSER"
            className="flex-1 flex flex-col p-0 m-0 overflow-hidden h-full"
          >
            <ScrollArea className="flex-1 h-0" ref={localScrollAreaRef}>
              {chatMessages.length ? (
                <div className="px-2 min-w-0">
                  <ChatMessages messages={chatMessages} />
                  {isStreaming && <ActionIndicator action={Mode.content} />}
                </div>
              ) : (
                <ComposerModeEmptyContent />
              )}
            </ScrollArea>
            {renderInputArea()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AIChat;

const StreamingIndicator = ({
  isStreaming = true,
  onStopStreaming = () => {},
}) => {
  if (!isStreaming) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onStopStreaming}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
            )}
            aria-label="Stop streaming"
          >
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-[3px] bg-red-500 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-[3px] bg-red-900"></span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Stop streaming</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StreamingWarning = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 shadow-md text-sm flex items-start">
        <AlertTriangle className="text-amber-500 h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-amber-800 font-medium">
            Please wait for the current response to finish
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Wrisor is currently responding. You can wait for it to finish or
            click the red square to stop the current response.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-amber-500 hover:text-amber-700 ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
