import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { scoreTone } from "@/lib/prep-data";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments — InterviewPrep AI" },
      { name: "description", content: "Timed MCQ assessments by topic with instant scoring and review." },
      { property: "og:title", content: "Assessments — InterviewPrep AI" },
      { property: "og:description", content: "Timed MCQ assessments with instant scoring and review." },
    ],
  }),
  component: AssessmentsPage,
});

type Mcq = {
  id: string;
  topic: string;
  question: string;
  options: string[] | null;
  correct_option: number | null;
  model_answer: string | null;
};

function AssessmentsPage() {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: mcqs = [] } = useQuery({
    queryKey: ["mcqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").eq("category", "mcq");
      if (error) throw error;
      return (data ?? []).map((q) => ({
        ...q,
        options: (q.options as string[] | null) ?? [],
      })) as Mcq[];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["assessment-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assessment_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const topics = useMemo(() => [...new Set(mcqs.map((q) => q.topic))].sort(), [mcqs]);
  const quiz = useMemo(() => mcqs.filter((q) => q.topic === topic), [mcqs, topic]);

  useEffect(() => {
    if (!topic || submitted) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [topic, submitted]);

  const correct = quiz.filter((q) => answers[q.id] === q.correct_option).length;
  const score = quiz.length ? Math.round((correct / quiz.length) * 100) : 0;

  async function submit() {
    setSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user!.id;
      await supabase.from("assessment_results").insert({
        user_id: userId,
        topic: topic!,
        total_questions: quiz.length,
        correct_answers: correct,
        score,
        duration_seconds: elapsed,
      });
      queryClient.invalidateQueries({ queryKey: ["assessment-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } finally {
      setSubmitted(true);
      setSaving(false);
    }
  }

  function reset() {
    setTopic(null);
    setAnswers({});
    setSubmitted(false);
    setElapsed(0);
  }

  if (!topic) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground">
            Pick a topic and take a timed MCQ round. Results feed straight into your progress.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const count = mcqs.filter((q) => q.topic === t).length;
            return (
              <Card key={t} className="card-hover">
                <CardContent className="p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10">
                    <ClipboardCheck className="h-5 w-5 text-accent" />
                  </span>
                  <p className="mt-3 font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{count} questions</p>
                  <Button className="mt-4 w-full" onClick={() => setTopic(t)}>
                    Start
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {!topics.length && (
            <p className="text-sm text-muted-foreground">No assessments available yet.</p>
          )}
        </div>

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate">{h.topic}</span>
                  <span className="text-muted-foreground">
                    {h.correct_answers}/{h.total_questions}
                  </span>
                  <span className={`font-semibold ${scoreTone(h.score)}`}>{h.score}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{topic}</h1>
          <p className="text-sm text-muted-foreground">{quiz.length} questions</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </Badge>
      </div>

      {submitted && (
        <Card className="border-accent/30">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className={`text-3xl font-bold ${scoreTone(score)}`}>{score}%</p>
            <Progress value={score} className="mt-3 h-2" />
            <p className="mt-3 text-sm text-muted-foreground">
              {correct} of {quiz.length} correct in {Math.floor(elapsed / 60)}m {elapsed % 60}s.
            </p>
            <Button className="mt-4" variant="outline" onClick={reset}>
              Back to assessments
            </Button>
          </CardContent>
        </Card>
      )}

      {quiz.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base leading-snug">
              {i + 1}. {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              value={answers[q.id]?.toString() ?? ""}
              onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}
              disabled={submitted}
            >
              {(q.options ?? []).map((opt, oi) => {
                const state = submitted
                  ? oi === q.correct_option
                    ? "border-success/50 bg-success/10"
                    : answers[q.id] === oi
                      ? "border-destructive/50 bg-destructive/10"
                      : "border-border"
                  : "border-border";
                return (
                  <div key={oi} className={`flex items-center gap-3 rounded-xl border p-3 ${state}`}>
                    <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                    <Label htmlFor={`${q.id}-${oi}`} className="cursor-pointer text-sm font-normal">
                      {opt}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            {submitted && q.model_answer && (
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{q.model_answer}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {!submitted && (
        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving || Object.keys(answers).length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit assessment
          </Button>
          <Button variant="outline" onClick={reset}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
