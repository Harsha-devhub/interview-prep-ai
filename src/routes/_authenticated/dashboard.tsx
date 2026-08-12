import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell,
  Mic,
  ClipboardCheck,
  Map as MapIcon,
  Flame,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InterviewPrep AI" },
      { name: "description", content: "Track your preparation score, daily goals, streak and weak areas at a glance." },
      { property: "og:title", content: "Dashboard — InterviewPrep AI" },
      { property: "og:description", content: "Preparation score, daily goals, streak and weak areas." },
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function streakDays(dates: Date[]) {
  const set = new Set(dates.map((d) => d.toDateString()));
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function DashboardPage() {
  const { data: profile } = useProfile();
  const { data } = useStats();

  const attempts = data?.attempts ?? [];
  const assessments = data?.assessments ?? [];
  const interviews = (data?.interviews ?? []).filter((i) => i.status === "completed");

  const technicalScores = attempts.filter((a) => a.category !== "hr").map((a) => a.score ?? 0);
  const hrScores = attempts.filter((a) => a.category === "hr").map((a) => a.score ?? 0);
  const assessmentScores = assessments.map((a) => a.score);
  const interviewScores = interviews.map((i) => i.overall_score ?? 0);

  const breakdown = [
    { label: "Technical Skills", value: avg(technicalScores) },
    { label: "Problem Solving", value: avg([...assessmentScores, ...technicalScores]) },
    { label: "Communication", value: avg(interviewScores) },
    { label: "HR Readiness", value: avg([...hrScores, ...interviewScores]) },
    {
      label: "Interview Confidence",
      value: Math.min(100, interviews.length * 20 + Math.round(avg(interviewScores) * 0.5)),
    },
  ];
  const prepScore = avg(breakdown.map((b) => b.value));

  const activityDates = [...attempts, ...assessments, ...interviews].map((r) => new Date(r.created_at));
  const streak = streakDays(activityDates);

  const todayAttempts = attempts.filter((a) => isToday(a.created_at));
  const todayTechnical = todayAttempts.filter((a) => a.category !== "hr").length;
  const todayHr = todayAttempts.filter((a) => a.category === "hr").length;
  const todayAssessments = assessments.filter((a) => isToday(a.created_at)).length;

  const focusTopic = profile?.skills?.[0] ?? "technical";
  const goals = [
    { label: `Complete 10 ${focusTopic} questions`, done: todayTechnical, target: 10, to: "/practice" as const },
    { label: "Take 1 assessment", done: todayAssessments, target: 1, to: "/assessments" as const },
    { label: "Complete 1 HR practice session", done: todayHr, target: 1, to: "/practice" as const },
  ];

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

  const recent = [
    ...interviews.map((i) => ({
      kind: "Mock interview",
      title: `${i.role} — ${i.interview_type}`,
      score: i.overall_score,
      at: i.created_at,
      icon: Mic,
    })),
    ...assessments.map((a) => ({
      kind: "Assessment",
      title: `${a.topic} · ${a.correct_answers}/${a.total_questions} correct`,
      score: a.score,
      at: a.created_at,
      icon: ClipboardCheck,
    })),
    ...attempts.map((a) => ({
      kind: "Question answered",
      title: a.question_text,
      score: a.score,
      at: a.created_at,
      icon: Dumbbell,
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  const stats = [
    { label: "Preparation score", value: `${prepScore}/100`, icon: Target },
    { label: "Questions answered", value: attempts.length, icon: Dumbbell },
    { label: "Assessments completed", value: assessments.length, icon: ClipboardCheck },
    { label: "Mock interviews", value: interviews.length, icon: Mic },
  ];

  const actions = [
    { title: "Practice questions", desc: "Technical & HR, graded instantly", to: "/practice", icon: Dumbbell },
    { title: "Mock interview", desc: "Full AI-led interview round", to: "/mock-interview", icon: Mic },
    { title: "Take assessment", desc: "Timed MCQ test by topic", to: "/assessments", icon: ClipboardCheck },
    { title: "View roadmap", desc: "Your personalised plan", to: "/roadmap", icon: MapIcon },
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
              {greeting()}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/70">
              Let&apos;s continue your interview preparation.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              🔥 {streak} Day Preparation Streak
            </div>
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
            <p className="text-xs uppercase tracking-wide text-primary-foreground/60">Preparation score</p>
            <p className="mt-1 text-4xl font-bold text-primary-foreground">{prepScore}<span className="text-lg text-primary-foreground/60">/100</span></p>
            <Progress value={prepScore} className="mt-3 h-2 bg-primary-foreground/20" />
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
          <CardHeader>
            <CardTitle className="text-base">Preparation score breakdown</CardTitle>
            <CardDescription>How your {prepScore}/100 is made up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="text-muted-foreground">{b.value}%</span>
                </div>
                <Progress value={b.value} className="mt-1.5 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s goals</CardTitle>
            <CardDescription>Reset every day at midnight</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((g) => {
              const done = g.done >= g.target;
              return (
                <Link key={g.label} to={g.to} className="flex items-start gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/60">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{g.label}</p>
                    <p className="text-xs text-muted-foreground">{Math.min(g.done, g.target)} / {g.target} done</p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length ? (
              recent.map((r, i) => (
                <div key={i} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/5">
                    <r.icon className="h-4 w-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{r.kind}</p>
                    <p className="truncate text-sm">{r.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{r.score ?? "—"}%</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing yet — answer a few questions to build your history.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Weak areas
            </CardTitle>
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
