// components/sidebar-panel.tsx
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useUserStore } from "@/store/user"
import {
  BarChart3,
  ChevronDown,
  FileText,
  Gift,
  HelpCircle,
  Home,
  MessageSquare,
  Plus,
  Search
} from "lucide-react"

export function SidebarPanel() {
  const { userDetails } = useUserStore()

  return (
    <div className="h-full bg-background flex flex-col">
      {/* User Header */}
      <div className="h-10 px-2 py-1.5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{userDetails?.name}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 h-9">
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      <Separator />

      {/* Documents List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 text-sm">
            <FileText className="h-4 w-4" />
            <span className="truncate">Welcome Document</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 text-sm">
            <FileText className="h-4 w-4" />
            <span className="truncate">My First Article</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 text-sm">
            <FileText className="h-4 w-4" />
            <span className="truncate">Research Notes</span>
          </Button>
        </div>
      </ScrollArea>

      {/* Usage Stats */}
      <div className="p-3 border-t bg-muted/50">
        <div className="space-y-3">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span>Plan usage</span>
              <span className="text-blue-600 font-medium">Free</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>AI words/day</span>
                <span>0/1000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          <Button className="w-full" size="sm">
            Get unlimited
          </Button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="p-3 border-t space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 h-8 text-xs">
          <Gift className="h-3 w-3" />
          Invite and earn
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-8 text-xs">
          <MessageSquare className="h-3 w-3" />
          Feedback
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-8 text-xs">
          <HelpCircle className="h-3 w-3" />
          Support
        </Button>
      </div>
    </div>
  )
}