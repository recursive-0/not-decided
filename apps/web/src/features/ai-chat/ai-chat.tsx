import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// Using CornerDownLeft as it looks closer to the screenshot's arrow icon
import { PlusCircle, Clock, Bot, BrainCircuit, CornerDownLeft } from "lucide-react";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useEditor } from "@/providers/editor-context-provider";
import { cn } from "@/lib/utils"; // Import cn if not already

// --- MOCK DATA FOR STYLING ---
const mockMessages = [
    { role: "user", content: "Can you explain what Rust is?" },
    { role: "assistant", content: "Sure! Rust is a systems programming language focused on safety, speed, and concurrency. It achieves memory safety without garbage collection." },
    { role: "user", content: "Tell me more about its memory safety." },
];
// ------------------------------

const AIChat = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [input, setInput] = useState("");
  const { startStreaming, stopStreaming, isLoading } = useSSEStream();
  const messages = mockMessages;
  const { insertTextAtCursor, isEditorReady, getCurrentContent } = useEditor();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      const promptToSend = input;
      setInput("");
      if (activeTab === "chat") {
        startStreaming(promptToSend, handleTokenReceived);
      } else if (activeTab === "composer") {
        startStreaming(promptToSend, handleTokenReceived);
      }
    }
  };

  const handleTokenReceived = (token: string) => {
    if (isEditorReady && activeTab === "composer") {
      insertTextAtCursor(token);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Allow Textarea too if needed
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Render Functions ---

  const renderHeader = () => (
    // Consistent Header Styling
    <div className="border-b border-border bg-secondary">
      <div className="h-10 flex items-center px-3 py-1.5"> {/* Consistent height */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-primary"> {/* Keep primary icon color */}
            <Bot className="w-4 h-4" />
          </div>
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="chat"
              className="text-xs font-medium px-2.5 py-1 data-[state=active]:bg-background data-[state=active]:text-[#073642] text-muted-foreground rounded-sm data-[state=active]:shadow-sm"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="composer"
              className="text-xs font-medium px-2.5 py-1 data-[state=active]:bg-background data-[state=active]:text-[#073642] text-muted-foreground rounded-sm data-[state=active]:shadow-sm"
            >
              Composer
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-[#073642]"> {/* Darker hover */}
            <PlusCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-[#073642]"> {/* Darker hover */}
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // --- !!! REVISED INPUT AREA !!! ---
  const renderInputArea = () => (
    // Container: secondary bg, top border, slightly less padding
    <div className="p-2 border-t border-border bg-secondary">
      {/* Relative container for input and embedded icon */}
      <div className="relative flex items-center">
        <Input
          placeholder="Ask anything (⌘L), @ to mention code blocks" // Match placeholder
           // Input: main bg, subtle border, dark text, muted placeholder, space for icon
          className={cn(
            "flex-1 bg-background h-9 text-sm rounded-md", // Use rounded-md
            "border border-border", // Subtle border
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", // Standard focus
            "text-[#073642] placeholder:text-muted-foreground", // Correct colors
            "pr-8" // Padding-right to accommodate the icon
           )}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        {/* Embedded Icon Button */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center w-8", // Position inside on the right
            isLoading || !input.trim()
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:text-[#073642]" // Change text color on hover
          )}
          onClick={!isLoading && input.trim() ? handleSendMessage : undefined} // Click handler
          aria-label="Send message"
        >
          <CornerDownLeft className="h-4 w-4 text-muted-foreground" /> {/* Muted icon color */}
        </div>
      </div>
      {/* Stop button (optional, keep styling if needed) */}
      {isLoading && (
         <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 text-xs h-7 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={stopStreaming}
        >
          Stop Generating
        </Button>
      )}
    </div>
  );
  // --- END REVISED INPUT AREA ---


  // --- Main Component Return ---
  return (
    <div className="flex flex-col h-full bg-background text-[#073642] overflow-hidden">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
        {renderHeader()}

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
             <div className="p-4 space-y-3 text-sm text-[#073642]">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-muted-foreground pt-10">
                    No messages yet. Start chatting!
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-md px-3 py-1.5 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-[#073642]' // User: Tinted bg, dark text
                          : 'bg-secondary text-[#073642]'  // Assistant: Secondary bg, dark text
                      }`}
                    >
                       {msg.content.split('\n').map((line, i) => <p key={i} className="leading-relaxed">{line}</p>)}
                    </div>
                  </div>
                ))}
                {isLoading && messages.length === 0 && (
                    <div className="text-center text-muted-foreground pt-10">
                      Waiting for response...
                    </div>
                )}
             </div>
          </ScrollArea>
          {renderInputArea()}
        </TabsContent>

        <TabsContent value="composer" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
          <ScrollArea className="flex-1">
             <div className="p-4 space-y-4 text-[#073642]">
                <div className="pb-2">
                  <div className="text-xl font-semibold mb-1 flex items-center gap-2">
                     <BrainCircuit className="w-5 h-5 text-primary"/>
                     How can I help with the document?
                  </div>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-xs font-medium">
                        Composer Mode
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Composer edits your document directly and knows its current content. Ask it to write, edit, or summarize.
                    </p>
                  </CardContent>
                </Card>
                <div className="text-center text-muted-foreground pt-6 text-sm">
                  Use the input below to instruct the Composer.
                  <br/>
                  (e.g., "Summarize the previous section", "Write an introduction about X")
                </div>
              </div>
          </ScrollArea>
          {renderInputArea()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIChat;