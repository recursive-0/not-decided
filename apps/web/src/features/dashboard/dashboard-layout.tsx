import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "@tanstack/react-router";
import { SidebarPanel } from "./sidebar-panel";

export const DashboardLayout = () => {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
    {/* Sidebar Panel */}
    <ResizablePanel 
      defaultSize={25} 
      minSize={2} 
      maxSize={20}
    >
      <SidebarPanel />
    </ResizablePanel>
    
    <ResizableHandle withHandle />
    
    {/* Main Content Area */}
    <ResizablePanel defaultSize={75}>
      <Outlet />
    </ResizablePanel>
  </ResizablePanelGroup>
  );
};
