import "./index.css";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable";
import { EditorContainer } from "../../web/src/features/editor/editor-container";
import AIChat from "../../web/src/features/ai-chat/ai-chat";
import { EditorProvider } from "@/providers/editor-context-provider";
import { Toaster } from "./components/ui/sonner";
import { ChatHandlerProvider } from "../../web/src/hooks/use-chat-handler";

export function App() {
  return (
    <EditorProvider>
      <ChatHandlerProvider>
        <div className="h-screen w-full bg-background flex flex-row">
          <ResizablePanelGroup direction="horizontal" className="h-screen">
          <ResizablePanel defaultSize={55}>
            <EditorContainer />
          </ResizablePanel>
          <ResizableHandle withHandle className="before:w-[1px]" />
          <ResizablePanel defaultSize={30} className="min-w-1/4">
            <AIChat />
          </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatHandlerProvider>
      <Toaster />
    </EditorProvider>
  );
}
