import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Clock, Send } from "lucide-react";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useEditor } from "@/providers/editor-context-provider"

const AIChat = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [input, setInput] = useState("");
  const { startStreaming, stopStreaming, isLoading } = useSSEStream();
  const { insertTextAtCursor, isEditorReady, getCurrentContent } = useEditor();
  
  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      // Process the message based on which tab is active
      if (activeTab === "chat") {
        // For chat tab, we might just want to get a response
        startStreaming(input, handleTokenReceived);
      } else if (activeTab === "composer") {
        // For composer tab, we might want to do something specific with the document
        const currentContent = getCurrentContent();
        const contextualPrompt = `Document content: ${currentContent}\n\nUser request: ${input}`;
        startStreaming(contextualPrompt, handleTokenReceived);
      }
      
      setInput(""); // Clear input after sending
    }
  };
  
  const handleTokenReceived = (token: string) => {
    if (isEditorReady) {
      insertTextAtCursor(token);
    }
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-white">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Header with tabs */}
        <div className="border-b">
          <div className="flex items-center px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-purple-100">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="currentColor" />
                  <path d="M12 2a6.5 6.5 0 00-6.5 6.5c0 1.76.5 3.16 1.65 4.67a34.14 34.14 0 003.5 3.5c.82.68 1.23 1.03 1.35 1.14.12.11.25.16.38.19h.24c.13-.03.26-.08.38-.19.12-.11.53-.46 1.35-1.14a34.14 34.14 0 003.5-3.5c1.15-1.51 1.65-2.91 1.65-4.67A6.5 6.5 0 0012 2z" fill="currentColor" />
                </svg>
              </div>
              <TabsList>
                <TabsTrigger value="chat" className="text-sm font-medium">Chat</TabsTrigger>
                <TabsTrigger value="composer" className="text-sm font-medium">Composer</TabsTrigger>
              </TabsList>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat tab content */}
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {/* Empty chat state or messages would go here */}
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Ask me to do anything..." 
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="rounded-full bg-black text-white hover:bg-gray-800"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Composer tab content */}
        <TabsContent value="composer" className="flex-1 flex flex-col p-0 m-0">
          <div className="p-4 flex-1 flex flex-col">
            <div className="pb-4">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-3xl font-semibold mb-2">
                Hello
              </div>
              <div className="text-black text-3xl font-semibold">
                How can I help you today?
              </div>
            </div>

            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                    🧩 Composer mode
                  </div>
                </div>
                <p className="text-gray-700">
                  Composer can directly edit and work on your document. It has full, real-time knowledge of your document.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4 flex-1">
              <Textarea 
                placeholder="Add a title to give context to the document."
                className="resize-none min-h-[60px]"
              />
              <Textarea 
                placeholder="Include a brief introduction outlining the purpose or objectives of the content."
                className="resize-none min-h-[80px]"
              />
              <Textarea 
                placeholder="Insert bullet points to summarize key information for easier readability."
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Ask me to do anything..." 
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="rounded-full bg-black text-white hover:bg-gray-800"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIChat;