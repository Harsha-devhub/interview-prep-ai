import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { TARGET_ROLES, SKILLS, EXPERIENCE_LEVELS } from "@/lib/prep-data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — InterviewPrep AI" },
      { name: "description", content: "Set your target role, experience level and technical skills." },
      { property: "og:title", content: "Profile — InterviewPrep AI" },
      { property: "og:description", content: "Set your target role, experience level and skills." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("fresher");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setRole(profile.target_role ?? "");
    setLevel(profile.experience_level ?? "fresher");
    setSkills(profile.skills ?? []);
  }, [profile]);

  function toggle(skill: string) {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }

  async function save() {
    await update.mutateAsync({
      full_name: fullName || null,
      target_role: role || null,
      experience_level: level,
      skills,
    });
    toast.success("Profile updated");
  }

  const initials = (fullName || "You")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your role and skills shape every question, interview and roadmap the AI generates.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{fullName || "Add your name"}</p>
            <p className="truncate text-sm text-muted-foreground">{role || "No target role set"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Target role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Experience level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)}>
              <Badge
                variant={skills.includes(s) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {s}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={update.isPending}>
        {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </div>
  );
}
