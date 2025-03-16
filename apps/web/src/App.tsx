import "./index.css";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { EditorContainer } from "./features/editor/editor-container";

export function App() {
  return (
    <div className="h-screen w-screen bg-neutral-50">
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-60px)]">
      <ResizablePanel defaultSize={65} className="bg-white">
        <EditorContainer />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={35}>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
  );
}