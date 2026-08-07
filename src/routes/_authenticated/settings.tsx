import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Moon, Bell, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InterviewPrep AI" },
      { name: "description", content: "Manage your account, notification preferences and appearance." },
      { property: "og:title", content: "Settings — InterviewPrep AI" },
      { property: "og:description", content: "Manage your account and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(false);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark(value: boolean) {
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, appearance and notification preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Signed in as</p>
              <p className="truncate text-sm text-muted-foreground">{email || "—"}</p>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
          </div>
          <Separator />
          <Button variant="destructive" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="dark" className="flex items-center gap-2 font-normal">
              <Moon className="h-4 w-4 text-muted-foreground" /> Dark appearance
            </Label>
            <Switch id="dark" checked={dark} onCheckedChange={toggleDark} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="reminders" className="flex items-center gap-2 font-normal">
              <Bell className="h-4 w-4 text-muted-foreground" /> Daily practice reminders
            </Label>
            <Switch
              id="reminders"
              checked={reminders}
              onCheckedChange={(v) => {
                setReminders(v);
                toast.success(v ? "Reminders on" : "Reminders off");
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
