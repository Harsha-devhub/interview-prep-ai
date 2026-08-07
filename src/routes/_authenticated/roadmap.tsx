import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { generateRoadmap, type Roadmap } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — InterviewPrep AI" },
      { name: "description", content: "Get a personalised 4-week interview preparation roadmap built around your weak topics." },
      { property: "og:title", content: "Roadmap — InterviewPrep AI" },
      { property: "og:description", content: "A personalised 4-week interview preparation plan." },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { data: profile } = useProfile();
  const build = useServerFn(generateRoadmap);
  const [plan, setPlan] = useState<Roadmap | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: attempts = [] } = useQuery({
    queryKey: ["roadmap-attempts"],
    queryFn: async () => {
      const { data } = await supabase.from("practice_attempts").select("topic, score");
      return data ?? [];
    },
  });

  const weakTopics = (() => {
    const m = new Map<string, { total: number; count: number }>();
    for (const a of attempts) {
      const key = a.topic ?? "General";
      const e = m.get(key) ?? { total: 0, count: 0 };
      e.total += a.score ?? 0;
      e.count += 1;
      m.set(key, e);
    }
    return [...m.entries()]
      .map(([topic, v]) => ({ topic, score: v.total / v.count }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((t) => t.topic);
  })();

  async function generate() {
    setBusy(true);
    try {
      const result = await build({
        data: {
          role: profile?.target_role ?? "Software Engineer",
          skills: profile?.skills ?? [],
          weakTopics,
          experienceLevel: profile?.experience_level ?? "fresher",
        },
      });
      setPlan(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build your roadmap.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            A 4-week plan generated from your target role, skills and weakest topics.
          </p>
        </div>
        <Button onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {plan ? "Regenerate" : "Generate plan"}
        </Button>
      </div>

      {weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected weak topics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {plan ? (
        <div className="space-y-4">
          <Card className="gradient-brand border-0">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-primary-foreground/60">Focus</p>
              <p className="mt-1 text-lg font-semibold text-primary-foreground">{plan.focus}</p>
            </CardContent>
          </Card>

          {plan.weeks?.map((w) => (
            <Card key={w.week} className="card-hover">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {w.week}
                </span>
                <CardTitle className="text-base">{w.theme}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ul className="space-y-2">
                  {w.goals?.map((g, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                {w.resources?.length > 0 && (
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> Resources
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      {w.resources.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No roadmap yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate a plan and the AI will sequence topics, goals and resources across four weeks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
