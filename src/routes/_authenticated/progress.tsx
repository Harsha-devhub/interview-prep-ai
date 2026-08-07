import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { scoreTone } from "@/lib/prep-data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — InterviewPrep AI" },
      { name: "description", content: "See how your interview scores trend and which topics still need work." },
      { property: "og:title", content: "Progress — InterviewPrep AI" },
      { property: "og:description", content: "See how your interview scores trend over time." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data } = useQuery({
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

  const attempts = data?.attempts ?? [];
  const assessments = data?.assessments ?? [];
  const interviews = data?.interviews ?? [];

  const byTopic = new Map<string, { total: number; count: number }>();
  for (const a of attempts) {
    const e = byTopic.get(a.topic) ?? { total: 0, count: 0 };
    e.total += a.score ?? 0;
    e.count += 1;
    byTopic.set(a.topic, e);
  }
  const topicData = [...byTopic.entries()]
    .map(([topic, v]) => ({ topic, score: Math.round(v.total / v.count) }))
    .sort((a, b) => b.score - a.score);

  const timeline = [...attempts]
    .reverse()
    .map((a, i) => ({ n: i + 1, score: a.score ?? 0 }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">
          Every practice answer, assessment and mock interview, tracked over time.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {timeline.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No practice history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {topicData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="topic" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-20} height={50} textAnchor="end" />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={30} />
                  <Tooltip />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Practice a few questions to build this chart.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assessments.length ? (
              assessments.slice(0, 6).map((a) => (
                <div key={a.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{a.topic}</span>
                    <span className={`font-semibold ${scoreTone(a.score)}`}>{a.score}%</span>
                  </div>
                  <Progress value={a.score} className="h-1.5" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No assessments completed yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mock interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviews.length ? (
              interviews.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{m.role}</span>
                  <Badge variant="outline">{m.interview_type}</Badge>
                  <span className={`font-semibold ${scoreTone(m.overall_score ?? 0)}`}>
                    {m.overall_score ?? "—"}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No mock interviews yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
