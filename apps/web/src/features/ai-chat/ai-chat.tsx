import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // Change from Input to Textarea
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  Clock,
  Bot,
  BrainCircuit,
  CornerDownLeft,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { useSSEStream } from "@/hooks/use-sse-stream";
import { useEditor } from "@/providers/editor-context-provider";
import { cn } from "@/lib/utils";
import { ChatMessages } from "./chat-messages";
import type { ChatMode, Message } from "@/types/messages";
import { useChatStore } from "@/store/chat";

const AIChat = () => {
  const chatMessages = useChatStore((state) => state.chatMessages);
  const addChatMessage = useChatStore((state) => state.addChatMessage);
  const currentChatMode = useChatStore((state) => state.currentChatMode);
  const setCurrentChatMode = useChatStore((state) => state.setCurrentChatMode);
  const appendTokenToMessage = useChatStore(
    (state) => state.appendTokenToLastMessage
  );

  const [input, setInput] = useState("");
  const { startStreaming, stopStreaming, isStreaming, currentStreamId } =
    useSSEStream();
  const { insertTextAtCursor, isEditorReady } = useEditor();
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const streamingMessageId = useRef(null);

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";

      // Calculate the new height based on scrollHeight (with a minimum height)
      const newHeight = Math.max(
        38,
        Math.min(150, textareaRef.current.scrollHeight)
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isStreaming) {
      setInput("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "38px";
      }

      const userMessageId = uuidv4();
      addChatMessage({
        id: userMessageId,
        role: "user",
        content: trimmedInput,
      });

      if (currentChatMode === "CHAT") {
        const llmMessageId = uuidv4();
        addChatMessage({
          id: llmMessageId,
          role: "echo",
          content: "",
        });
        streamingMessageId.current = llmMessageId;
        startStreaming("CHAT", trimmedInput, handleTokenReceived);
      } else if (currentChatMode === "COMPOSER") {
        const llmMessageId = uuidv4();
        addChatMessage({
          id: llmMessageId,
          role: "echo",
          content: "",
        });
        streamingMessageId.current = llmMessageId;
        startStreaming("COMPOSER", trimmedInput, handleTokenReceived);
      }
    }
  };

  const handleTokenReceived = (token: string) => {
    if (currentChatMode === "COMPOSER" && isEditorReady) {
      console.log("TOKEN IS: ", token)
      appendTokenToMessage(token)
    } else if (currentChatMode === "CHAT" && streamingMessageId.current) {
      appendTokenToMessage(token);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTabChange = (value) => {
    setCurrentChatMode(value);
  };

  const renderHeader = () => (
    <div className="border-b border-border bg-[var(--color-palette-beige-2)] flex-shrink-0">
      <div className="h-10 flex items-center px-3 py-1.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="CHAT"
              className="text-xs font-medium px-2.5 py-1 data-[state=active]:bg-background data-[state=active]:text-[#073642] text-muted-foreground rounded-sm data-[state=active]:shadow-sm"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="COMPOSER"
              className="text-xs font-medium px-2.5 py-1 data-[state=active]:bg-background data-[state=active]:text-[#073642] text-muted-foreground rounded-sm data-[state=active]:shadow-sm"
            >
              Composer
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-[#073642]"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-[#073642]"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderInputArea = () => (
    <div className="p-2 flex-shrink-0">
      <div className="relative flex items-start">
        <Textarea
          ref={textareaRef}
          placeholder="Ask anything (⌘L), @ to mention code blocks"
          style={{
            backgroundColor: "var(--color-palette-gold-light)"
          }}
          className="flex-1 text-sm rounded-md resize-none overflow-hidden border border-[var(--color-palette-gold-dark)]
            text-[var(--color-palette-dark)] placeholder:text-muted-foreground
            pr-8 py-2 min-h-[38px] max-h-[150px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
        />
        <div
          className={cn(
            "absolute right-2 top-2 flex items-center justify-center w-6 h-6",
            isStreaming || !input.trim()
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:text-destructive"
          )}
          onClick={!isStreaming && input.trim() ? handleSendMessage : undefined}
          aria-label="Send message"
        >
          <CornerDownLeft className={`h-4 w-4 text-palette-dark`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col h-full bg-[var(--color-palette-beige-2)] text-[#073642]">
      <Tabs
        value={currentChatMode}
        onValueChange={handleTabChange}
        className="flex flex-col h-full"
      >
        {renderHeader()}

        <div className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsContent
            value="CHAT"
            className="flex-1 flex flex-col p-0 m-0 overflow-hidden h-full"
          >
            <ScrollArea className="w-full flex-1 h-0" ref={scrollAreaRef}>
              <div className="px-2 min-w-0">
                <ChatMessages messages={chatMessages} />
              </div>
            </ScrollArea>
            {renderInputArea()}
          </TabsContent>

          <TabsContent
            value="COMPOSER"
            className="flex-1 flex flex-col p-0 m-0 overflow-hidden h-full"
          >
            <ScrollArea className="flex-1 h-0" ref={scrollAreaRef}>
              {chatMessages.length ?  <div className="px-2 min-w-0">
                <ChatMessages messages={chatMessages} />
              </div> : <div className="p-4 space-y-4 text-[#073642]">
                <div className="pb-2">
                  <div className="text-xl font-semibold mb-1 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    How can I help with the document?
                  </div>
                </div>
                <Card className="bg-palette-beige-1 border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-xs font-medium">
                        Composer Mode
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Composer edits your document directly and knows its
                      current content. Ask it to write, edit, or summarize.
                    </p>
                  </CardContent>
                </Card>
                <div className="text-center text-muted-foreground pt-6 text-sm">
                  Use the input below to instruct the Composer.
                  <br />
                  (e.g., "Summarize the previous section", "Write an
                  introduction about X")
                </div>
              </div>}
            </ScrollArea>
            {renderInputArea()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AIChat;
