import { SidebarProvider } from "@/components/ui/sidebar"
import { Outlet } from "@tanstack/react-router"


export const DashboardLayout = () => {
    return (
        <SidebarProvider>
            {/* <DashboardSidebar /> */}
            <Outlet />
        </SidebarProvider>
    )
}