import "./index.css";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { EditorContainer } from "./features/editor/editor-container";
import AIChat from "./features/ai-chat/ai-chat";
import { EditorProvider } from "@/providers/editor-context-provider"

export function App() {
  return (
    <div className="h-screen w-screen bg-neutral-50">
      <EditorProvider>
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-60px)]">
          <ResizablePanel defaultSize={65} className="bg-white">
            <EditorContainer />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35}>
            <AIChat />
          </ResizablePanel>
        </ResizablePanelGroup>
      </EditorProvider>
    </div>
  );
}