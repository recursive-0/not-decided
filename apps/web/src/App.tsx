import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EditorProvider } from "@/providers/editor-context-provider";
import AIChat from "../../web/src/features/ai-chat/ai-chat";
import { EditorContainer } from "../../web/src/features/editor/editor-container";
import { ChatHandlerProvider } from "../../web/src/hooks/use-chat-handler";
import { Toaster } from "./components/ui/sonner";

export function App() {
  return (
    <EditorProvider>
      <ChatHandlerProvider>
        <div className="h-screen w-full flex flex-row">
          <ResizablePanelGroup direction="horizontal" className="h-screen">
          <ResizablePanel defaultSize={55}>
            <EditorContainer />
          </ResizablePanel>
          <ResizableHandle withHandle className="before:w-[1px] bg-border" />
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
