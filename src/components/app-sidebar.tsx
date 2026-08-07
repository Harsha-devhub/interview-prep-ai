import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Dumbbell,
  Mic,
  ClipboardCheck,
  Library,
  TrendingUp,
  Map,
  User,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const prepare = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Practice", url: "/practice", icon: Dumbbell },
  { title: "Mock Interview", url: "/mock-interview", icon: Mic },
  { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
  { title: "Question Bank", url: "/question-bank", icon: Library },
] as const;

const grow = [
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Roadmap", url: "/roadmap", icon: Map },
] as const;

const account = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderGroup = (label: string, items: readonly { title: string; url: string; icon: typeof User }[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5 px-2 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-accent">
            <Sparkles className="h-4.5 w-4.5 text-accent-foreground" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold text-sidebar-accent-foreground">
                InterviewPrep AI
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                Land your first offer
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Prepare", prepare)}
        {renderGroup("Grow", grow)}
        {renderGroup("Account", account)}
      </SidebarContent>
    </Sidebar>
  );
}
