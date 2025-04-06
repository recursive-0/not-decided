import "./index.css";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { EditorContainer } from "./features/editor/editor-container";
import AIChat from "./features/ai-chat/ai-chat";
import { EditorProvider } from "@/providers/editor-context-provider"

export function App() {
  return (
    <div className="h-screen w-screen bg-background">
      <EditorProvider>
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-60px)]">
          <ResizablePanel defaultSize={65}>
            <EditorContainer />
          </ResizablePanel>
          <ResizableHandle withHandle className="before:w-[1px]" />
          <ResizablePanel defaultSize={35} className="min-w-1/4">
            <AIChat />
          </ResizablePanel>
        </ResizablePanelGroup>
      </EditorProvider>
    </div>
  );
}