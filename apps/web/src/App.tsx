import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EditorProvider } from "@/providers/editor-context-provider";
import AIChat from "../../web/src/features/ai-chat/ai-chat";
import { EditorContainer } from "../../web/src/features/editor/editor-container";
import { ChatHandlerProvider } from "../../web/src/hooks/use-chat-handler";
import { Toaster } from "./components/ui/sonner";
import { useUIStore } from "./store/ui";

export function App() {
  return (
    <EditorProvider>
      <ChatHandlerProvider>
        <div className="h-screen w-full flex flex-row relative">
          <ResizablePanelGroup direction="horizontal" className="h-screen">
          <ResizablePanel defaultSize={55} className="relative">
            <EditorContainer />
            <WordCounter />
          </ResizablePanel>
          {/* disable resizing when transformation is happening or when there are edits */}
          <ResizableHandle withHandle className="before:w-[1px] bg-border" /> 
          <ResizablePanel defaultSize={30} className="min-w-1/4 relative">
            <AIChat />
          </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatHandlerProvider>
      <Toaster />
    </EditorProvider>
  );
}


const WordCounter = () => {
  const { document } = useUIStore();
  return (
    <div className="absolute bottom-2 -right-1.5 px-2 z-100 border shadow-md border-y-border border-l-border border-r-white rounded-l-md bg-white p-2 py-1 flex flex-row gap-2">
      <div className="flex flex-row gap-2 items-center bg-white">
        <span className="w-2 h-2 bg-primary/60 rounded-sm shadow-md shadow-black/30"></span>
        <div className="flex flex-row gap-1">
          <div className="text-layer-6 text-xs">{document.words === 0 ? "0" : document.words - 1}</div>
          <span className="text-layer-10 text-xs"> words </span>
        </div>
      </div>
    </div>
  );
};