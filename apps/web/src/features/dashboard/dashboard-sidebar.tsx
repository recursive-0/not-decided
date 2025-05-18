import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarTrigger,
  } from "@/components/ui/sidebar"; // Assuming these are styled components that can take classNames
  import { Link } from "@tanstack/react-router";
  import { FilePlus } from "lucide-react"; // Added some example icons
  
  // Let's make the links array more flexible for icons
  const links = [
    {
      id: "documents",
      title: "Documents",
      url: "/dashboard/documents",
      icon: FilePlus, // The actual Lucide icon component
    },
    // Add more links here if needed, e.g.:
    // {
    //   id: "settings",
    //   title: "Settings",
    //   url: "/dashboard/settings",
    //   icon: Settings,
    // },
  ];
  
  export function DashboardSidebar() {
    return (
      <Sidebar>
        <div className="bg-[#b19a81] text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
        <SidebarHeader className="px-4 py-5 border-b border-sidebar-border flex flex-row items-center justify-between">
          {/* Wrisor Title - making it a bit more prominent and using a theme color */}
          <span className="text-xl font-bold text-primary">Wrisor</span>
          <SidebarTrigger className="text-sidebar-foreground hover:text-primary transition-colors" />
        </SidebarHeader>
  
        <SidebarContent className="flex-grow p-4 space-y-6"> {/* Added space-y for spacing between groups if any */}
          <SidebarGroup>
            <h2 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main
            </h2>
            <div className="space-y-1"> {/* Space between links */}
              {links.map((linkItem) => {
                const IconComponent = linkItem.icon; // Get the icon component
                return (
                  <Link
                    key={linkItem.id}
                    to={linkItem.url}
                    // Base classes for all links
                    className="group flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out
                               text-sidebar-foreground hover:bg-palette-beige-2 hover:text-primary
                               dark:hover:bg-palette-dark dark:hover:text-sidebar-primary"
                    // Props for when the link is active
                    activeProps={{
                      className: "!bg-primary !text-primary-foreground shadow-md", // Notice ! to ensure override if base components have specificity
                    }}
                    // Props for when the link is inactive (optional, if you want different inactive styling beyond default)
                    // inactiveProps={{
                    //   className: "opacity-75"
                    // }}
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0 
                                            group-hover:text-primary 
                                            group-[.text-primary-foreground]:text-primary-foreground" // Icon color matches text color (active state)
                    />
                    <span className="text-sm font-medium">{linkItem.title}</span>
                  </Link>
                );
              })}
            </div>
          </SidebarGroup>
  
          {/* Example of another group */}
          {/* <SidebarGroup>
            <h2 className="px-2 mb-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account
            </h2>
            <div className="space-y-1">
              <Link
                to="/dashboard/profile"
                className="group flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out
                           text-sidebar-foreground hover:bg-palette-beige-2 hover:text-primary
                           dark:hover:bg-palette-dark dark:hover:text-sidebar-primary"
                activeProps={{ className: "!bg-primary !text-primary-foreground shadow-md" }}
              >
                <UserCircle className="h-5 w-5 flex-shrink-0 group-hover:text-primary group-[.text-primary-foreground]:text-primary-foreground" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
            </div>
          </SidebarGroup> */}
  
        </SidebarContent>
  
        <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
          {/* You can add content here, e.g., a settings link or user info */}
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Wrisor</span>
        </SidebarFooter>
        </div>
      </Sidebar>
    );
  }