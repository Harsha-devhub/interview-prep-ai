import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell,
  Mic,
  ClipboardCheck,
  Map,
  Flame,
  Target,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InterviewPrep AI" },
      { name: "description", content: "Track your interview readiness, streaks and weak topics at a glance." },
      { property: "og:title", content: "Dashboard — InterviewPrep AI" },
      { property: "og:description", content: "Track your interview readiness, streaks and weak topics." },
    ],
  }),
  component: DashboardPage,
});

function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [attempts, assessments, interviews] = await Promise.all([
        supabase.from("practice_attempts").select("*").order("created_at", { ascending: false }),
        supabase.from("assessment_results").select("*").order("created_at", { ascending: false }),
        supabase.from("mock_interviews").select("*").order("created_at", { ascending: false }),
      ]);
      return {
        attempts: attempts.data ?? [],
        assessments: assessments.data ?? [],
        interviews: interviews.data ?? [],
      };
    },
  });
}

function DashboardPage() {
  const { data: profile } = useProfile();
  const { data } = useStats();

  const attempts = data?.attempts ?? [];
  const assessments = data?.assessments ?? [];
  const interviews = (data?.interviews ?? []).filter((i) => i.status === "completed");

  const avgPractice = attempts.length
    ? Math.round(attempts.reduce((a, b) => a + (b.score ?? 0), 0) / attempts.length)
    : 0;
  const avgAssessment = assessments.length
    ? Math.round(assessments.reduce((a, b) => a + b.score, 0) / assessments.length)
    : 0;
  const readiness = Math.round(
    (avgPractice * 0.4 + avgAssessment * 0.3 + (interviews.length ? (interviews[0]?.overall_score ?? 0) : 0) * 0.3) || 0,
  );

  const days = new Set(
    [...attempts, ...assessments].map((r) => new Date(r.created_at).toDateString()),
  );

  const trend = [...attempts]
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({ name: `#${i + 1}`, score: a.score ?? 0 }));

  const topicScores = new Map<string, { total: number; count: number }>();
  for (const a of attempts) {
    const key = a.topic || "General";
    const entry = topicScores.get(key) ?? { total: 0, count: 0 };
    entry.total += a.score ?? 0;
    entry.count += 1;
    topicScores.set(key, entry);
  }
  const weakTopics = [...topicScores.entries()]
    .map(([topic, v]) => ({ topic, score: Math.round(v.total / v.count) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const stats = [
    { label: "Readiness score", value: `${readiness}%`, icon: Target },
    { label: "Questions practised", value: attempts.length, icon: Dumbbell },
    { label: "Assessments taken", value: assessments.length, icon: ClipboardCheck },
    { label: "Active days", value: days.size, icon: Flame },
  ];

  const actions = [
    { title: "Practice questions", desc: "Technical & HR, graded instantly", to: "/practice", icon: Dumbbell },
    { title: "Mock interview", desc: "Full AI-led interview round", to: "/mock-interview", icon: Mic },
    { title: "Take assessment", desc: "Timed MCQ test by topic", to: "/assessments", icon: ClipboardCheck },
    { title: "View roadmap", desc: "Your personalised 4-week plan", to: "/roadmap", icon: Map },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl gradient-brand p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <Badge className="mb-3 rounded-full bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
              {profile?.target_role ? `Preparing for ${profile.target_role}` : "Set your target role"}
            </Badge>
            <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/70">
              {attempts.length
                ? "Keep the momentum going — your weakest topics are listed below."
                : "Start with a few practice questions so the AI can map your strengths."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link to="/practice">Continue practice</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/mock-interview">Start mock interview</Link>
              </Button>
            </div>
          </div>
          <div className="w-full max-w-[220px] rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/60">Interview readiness</p>
            <p className="mt-1 text-4xl font-bold text-primary-foreground">{readiness}%</p>
            <Progress value={readiness} className="mt-3 h-2 bg-primary-foreground/20" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="card-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10">
                <s.icon className="h-5 w-5 text-accent" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent practice scores</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[240px]">
            {trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={30} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2} fill="url(#scoreFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Answer a few practice questions to see your trend.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weak topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakTopics.length ? (
              weakTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{t.topic}</span>
                    <span className="text-muted-foreground">{t.score}%</span>
                  </div>
                  <Progress value={t.score} className="mt-1.5 h-1.5" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet — practice to reveal weak spots.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="card-hover h-full">
              <CardContent className="p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/5">
                  <a.icon className="h-5 w-5 text-primary" />
                </span>
                <p className="mt-3 flex items-center gap-1 font-semibold">
                  {a.title} <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
