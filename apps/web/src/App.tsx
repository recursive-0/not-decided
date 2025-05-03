import "./index.css";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { EditorContainer } from "../../web/src/features/editor/editor-container";
import AIChat from "../../web/src/features/ai-chat/ai-chat";
import { EditorProvider } from "@/providers/editor-context-provider"
import { Toaster } from "./components/ui/sonner";
import { ChatHandlerProvider } from "../../web/src/hooks/use-chat-handler";

export function App() {
  return (
    <div className="h-screen w-screen bg-background">
      <EditorProvider>
      <ChatHandlerProvider>  
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-60px)]">
          <ResizablePanel defaultSize={65}>
            <EditorContainer />
          </ResizablePanel>
          <ResizableHandle  withHandle className="before:w-[1px]" />
          <ResizablePanel defaultSize={35} className="min-w-1/4">
            <AIChat />
          </ResizablePanel>
        </ResizablePanelGroup>
            </ChatHandlerProvider>
      </EditorProvider>
      <Toaster />
    </div>
  );
}