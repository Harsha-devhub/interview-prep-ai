import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, ThumbsUp, AlertCircle, MessageSquareQuote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { evaluateHrAnswer, type HrEvaluation } from "@/lib/ai.functions";
import { HR_QUESTIONS, scoreTone } from "@/lib/prep-data";

export const Route = createFileRoute("/_authenticated/hr-practice")({
  head: () => ({
    meta: [
      { title: "HR Interview Practice — InterviewPrep AI" },
      {
        name: "description",
        content:
          "Practise classic HR interview questions and get AI feedback on relevance, structure, clarity, professionalism, confidence and conciseness.",
      },
      { property: "og:title", content: "HR Interview Practice — InterviewPrep AI" },
      { property: "og:description", content: "AI-scored practice for the HR round." },
    ],
  }),
  component: HrPracticePage,
});

function HrPracticePage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const evaluate = useServerFn(evaluateHrAnswer);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HrEvaluation | null>(null);

  const current = HR_QUESTIONS[index]!;

  async function submit() {
    if (answer.trim().length < 20) {
      toast.error("Write a bit more so the coach can grade you properly.");
      return;
    }
    setBusy(true);
    try {
      const evaluation = await evaluate({
        data: { question: current.question, answer, role: profile?.target_role ?? undefined },
      });
      setResult(evaluation);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("practice_attempts").insert({
          user_id: auth.user.id,
          category: "hr",
          topic: current.topic,
          question_text: current.question,
          user_answer: answer,
          score: evaluation.overall_score,
          feedback: evaluation.verdict,
        });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not evaluate that answer.");
    } finally {
      setBusy(false);
    }
  }

  function pick(i: number) {
    setIndex(i);
    setAnswer("");
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HR Interview Practice</h1>
        <p className="text-sm text-muted-foreground">
          Answer the questions every panel asks, and get scored on the six things HR listens for.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose a question</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {HR_QUESTIONS.map((q, i) => (
            <button key={q.question} type="button" onClick={() => pick(i)}>
              <Badge
                variant={i === index ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-left text-xs font-normal"
              >
                {q.question}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            {current.topic}
          </Badge>
          <CardTitle className="text-lg leading-snug">{current.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={7}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer as if you were sitting in the interview…"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Get AI feedback
            </Button>
            <Button variant="outline" onClick={() => pick((index + 1) % HR_QUESTIONS.length)}>
              Next question
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall</p>
                <p className={`text-3xl font-bold ${scoreTone(result.overall_score)}`}>
                  {result.overall_score}
                  <span className="text-base text-muted-foreground">/100</span>
                </p>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">{result.verdict}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scoring breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.dimensions?.map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{d.name}</span>
                    <span className={scoreTone(d.score)}>{d.score}</span>
                  </div>
                  <Progress value={d.score} />
                  <p className="text-xs text-muted-foreground">{d.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThumbsUp className="h-4 w-4 text-success" /> What worked
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {result.strengths?.map((s, i) => <p key={i}>• {s}</p>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-warning" /> Improve next time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {result.improvements?.map((s, i) => <p key={i}>• {s}</p>)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareQuote className="h-4 w-4 text-primary" /> Sample strong answer
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {result.model_answer}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
