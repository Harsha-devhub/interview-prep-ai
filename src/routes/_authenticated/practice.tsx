import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { evaluateAnswer, type AnswerEvaluation } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practice — InterviewPrep AI" },
      { name: "description", content: "Answer real technical and HR interview questions and get instant AI grading." },
      { property: "og:title", content: "Practice — InterviewPrep AI" },
      { property: "og:description", content: "Answer real interview questions and get instant AI grading." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<"technical" | "hr">("technical");
  const [topic, setTopic] = useState("all");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerEvaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const grade = useServerFn(evaluateAnswer);

  const { data: questions = [] } = useQuery({
    queryKey: ["questions", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("category", category)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const topics = useMemo(
    () => [...new Set(questions.map((q) => q.topic))].sort(),
    [questions],
  );
  const filtered = useMemo(
    () => (topic === "all" ? questions : questions.filter((q) => q.topic === topic)),
    [questions, topic],
  );
  const question = filtered[index % Math.max(filtered.length, 1)];

  async function submit() {
    if (!question || answer.trim().length < 10) {
      toast.error("Write a bit more before submitting.");
      return;
    }
    setBusy(true);
    try {
      const evaluation = await grade({
        data: {
          question: question.question,
          answer,
          category,
          role: profile?.target_role ?? "Software Engineer",
        },
      });
      setResult(evaluation);
      await supabase.from("practice_attempts").insert({
        user_id: (await supabase.auth.getUser()).data.user!.id,
        question_id: question.id,
        category,
        topic: question.topic,
        question_text: question.question,
        user_answer: answer,
        score: Math.max(0, Math.min(100, Math.round(evaluation.score))),
        feedback: evaluation.verdict,
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Answer in your own words. The AI coach grades depth, structure and clarity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,240px)]">
        <Tabs
          value={category}
          onValueChange={(v) => {
            setCategory(v as "technical" | "hr");
            setIndex(0);
            setTopic("all");
            setAnswer("");
            setResult(null);
          }}
        >
          <TabsList>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={topic}
          onValueChange={(v) => {
            setTopic(v);
            setIndex(0);
            setAnswer("");
            setResult(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {question && <Badge variant="secondary">{question.topic}</Badge>}
            {question && <Badge variant="outline">{question.difficulty}</Badge>}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length ? `${(index % filtered.length) + 1} of ${filtered.length}` : "0"}
            </span>
          </div>
          <CardTitle className="text-lg leading-snug">
            {question?.question ?? "No questions for this filter yet."}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={7}
            placeholder="Type your answer as you would say it in the interview..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!question || busy}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={submit} disabled={busy || !question}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Get AI feedback
            </Button>
            <Button variant="outline" onClick={nextQuestion} disabled={!filtered.length}>
              <RefreshCw className="mr-2 h-4 w-4" /> Next question
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-accent/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">AI feedback</CardTitle>
              <span className="text-2xl font-bold text-accent">{Math.round(result.score)}%</span>
            </div>
            <Progress value={result.score} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="font-medium">{result.verdict}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">What worked</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">Improve</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.improvements?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            </div>
            {result.model_answer && (
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model answer
                </p>
                <p>{result.model_answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
