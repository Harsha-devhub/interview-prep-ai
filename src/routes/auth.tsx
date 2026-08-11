import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/use-session";
import { TARGET_ROLES, EXPERIENCE_LEVELS } from "@/lib/prep-data";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — InterviewPrep AI" },
      {
        name: "description",
        content: "Sign in to InterviewPrep AI to practise technical and HR interviews with an AI coach.",
      },
      { property: "og:title", content: "Sign in — InterviewPrep AI" },
      {
        property: "og:description",
        content: "Sign in to practise technical and HR interviews with an AI coach.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 4 + i));

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [level, setLevel] = useState("beginner");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"auth" | "forgot">("auth");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: fullName,
          college,
          graduation_year: gradYear ? Number(gradYear) : null,
          target_role: targetRole,
          experience_level: level,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Check your inbox to confirm your email address.");
      return;
    }
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          college,
          graduation_year: gradYear ? Number(gradYear) : null,
          target_role: targetRole,
          experience_level: level,
        })
        .eq("user_id", data.user.id);
    }
    navigate({ to: "/onboarding", replace: true });
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent. Check your inbox.");
    setMode("auth");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between gradient-brand p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold text-primary-foreground">InterviewPrep AI</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-primary-foreground">
            Prepare Smarter. Interview Better.
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            Role-specific question banks, timed MCQ assessments, AI mock interviews and a roadmap
            built around your weak topics.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">Built for students and fresh graduates.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {mode === "forgot" ? (
            <>
              <h1 className="font-display text-2xl font-bold">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a secure link to set a new password.
              </p>
              <form onSubmit={sendReset} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Send reset link
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("auth")}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Welcome</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start preparing in less than a minute.
              </p>

              <Button variant="outline" className="mt-6 w-full" onClick={google}>
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={signIn} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="si-pass">Password</Label>
                      <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      Sign in <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={signUp} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-name">Full name</Label>
                      <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-pass">Password</Label>
                      <Input id="su-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-college">College / University</Label>
                      <Input id="su-college" required maxLength={120} value={college} onChange={(e) => setCollege(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Graduation year</Label>
                        <Select value={gradYear} onValueChange={setGradYear}>
                          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Experience</Label>
                        <Select value={level} onValueChange={setLevel}>
                          <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((l) => (
                              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target job role</Label>
                      <Select value={targetRole} onValueChange={setTargetRole}>
                        <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                        <SelectContent>
                          {TARGET_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
