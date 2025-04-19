import React, { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  Clock,
  Bot,
  BrainCircuit,
  CornerDownLeft,
  Square,
  AlertTriangle,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ChatMessages } from "./chat-messages";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PendingChangesWarning from "./pending-changes-warning-popup";
import { useEditorStore } from "@/store/editor";

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

  const localScrollAreaRef = useRef<HTMLDivElement | null>(null);

  const { totalCurrentEdits } = useEditorStore()

  const [input, setInput] = useState<string>("")
  const [showStreamingWarning, setShowStreamWarning] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const onStopStreaming = () => {
    console.log("Stop the stream")
    stopStreaming()
  }

  const onSendMessage = () => {
    if(isStreaming){
      setShowStreamWarning(true)
      return
    }

    if(totalCurrentEdits > 0){
      setPendingChangesPopup(true)
      return
    }

    handleSendMessage(input)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If streaming is active, show warning and prevent default behavior
    if (isStreaming) {
      e.preventDefault();
      setShowStreamWarning(true);
      return;
    }

    if(isPendingChangesPopupOpen){

    }
    
    // If key is enter, allow normal behavior (newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      return; // Default behavior will insert a newline
    }
    
    // If key combination is Enter + Return, send the message and prevent newline
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isThinking) {
        if(totalCurrentEdits > 0){
          setPendingChangesPopup(true)
          return
        }
        handleSendMessage(input)
        setInput("")
      }
    }
  }

  useEffect(() => {
    if (localScrollAreaRef.current) {
      registerScrollAreaRef(localScrollAreaRef.current);
    }
    // Optional: Cleanup function to unregister if the component unmounts
    // return () => {
    //   registerScrollAreaRef(null);
    // };
  }, [registerScrollAreaRef]);

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
    <div className="p-2 flex-shrink-0 relative">
      <div className="relative flex items-start">
        <Textarea
          ref={textareaRef}
          placeholder="Ask anything (⌘L), @ to mention code blocks"
          style={{
            backgroundColor: "var(--color-palette-gold-light)",
          }}
          className="flex-1 text-sm rounded-md resize-none overflow-hidden border border-[var(--color-palette-gold-dark)]
            text-[var(--color-palette-dark)] placeholder:text-muted-foreground
            pr-8 py-2 min-h-[38px] max-h-[150px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          rows={1}
        />

        {isStreaming ? (
          <StreamingIndicator isStreaming={isStreaming} onStopStreaming={onStopStreaming} />
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
    if(!isStreaming){
      setShowStreamWarning(false)
    } 
  },[isStreaming])

  return (
    <div className="w-full flex flex-col h-full bg-[var(--color-palette-beige-2)] text-[#073642]">
      <Tabs
        autoFocus
        value={currentChatMode}
        onValueChange={() => setCurrentChatMode(currentChatMode)}
        className="flex flex-col h-full"
      >
        {renderHeader()}

        <div className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsContent
            value="CHAT"
            className="flex-1 flex flex-col p-0 m-0 overflow-hidden h-full"
          >
            <ScrollArea className="w-full flex-1 h-0" ref={localScrollAreaRef}>
              <div className="px-2 min-w-0">
                <ChatMessages messages={chatMessages} />
                {isThinking && <ThinkingLoader />}
              </div>
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
                  {isThinking && <ThinkingLoader />}
                </div>
              ) : (
                <div className="p-4 space-y-4 text-[#073642]">
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
                </div>
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



const StreamingIndicator = ({ isStreaming = true, onStopStreaming = () => {} }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  
  // useEffect(() => {
  //   if (!isStreaming) return;
    
  //   const interval = setInterval(() => {
  //     setIsPulsing(prev => !prev);
  //   }, 1500);
    
  //   return () => clearInterval(interval);
  // }, [isStreaming]);
  
  if (!isStreaming) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onStopStreaming}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer",
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
  onClose 
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
          <p className="text-amber-800 font-medium">Please wait for the current response to finish</p>
          <p className="text-amber-700 text-xs mt-1">
            Wrisor is currently responding. You can wait for it to finish or click the red square to stop the current response.
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
}