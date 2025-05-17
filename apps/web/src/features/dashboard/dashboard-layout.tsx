import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Outlet } from "@tanstack/react-router"


export const DashboardLayout = () => {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <Outlet />
        </SidebarProvider>
    )
}