import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Search, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function TopBar({
  email,
  fullName,
  targetRole,
}: {
  email?: string;
  fullName?: string | null;
  targetRole?: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initials = (fullName || email || "U").slice(0, 2).toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur-xl sm:px-5">
      <SidebarTrigger className="shrink-0" />

      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions, topics, roles..."
          className="h-9 w-full rounded-full border-border bg-muted/60 pl-9 text-sm"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {targetRole && (
          <Badge variant="secondary" className="hidden items-center gap-1.5 rounded-full py-1 lg:inline-flex">
            <Target className="h-3.5 w-3.5 text-accent" />
            <span className="max-w-[160px] truncate">Preparing: {targetRole}</span>
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-ring focus-visible:ring-2">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{fullName || email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
