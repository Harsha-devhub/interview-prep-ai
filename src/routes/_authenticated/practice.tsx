import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { evaluateAnswer, type AnswerEvaluation } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practice — InterviewPrep AI" },
      { name: "description", content: "Practice MCQ, conceptual, coding and interview questions by topic and difficulty with instant AI grading." },
      { property: "og:title", content: "Practice — InterviewPrep AI" },
      { property: "og:description", content: "Practice by topic, difficulty and question type with instant AI grading." },
    ],
  }),
  component: PracticePage,
});

const CATEGORIES = [
  "Java", "Python", "C", "JavaScript", "SQL", "DSA", "DBMS",
  "Operating Systems", "Computer Networks", "OOP", "Machine Learning",
  "React", "Node.js",
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TYPES = [
  { value: "mcq", label: "MCQ" },
  { value: "conceptual", label: "Conceptual" },
  { value: "coding", label: "Coding" },
  { value: "interview", label: "Interview Question" },
];

type Result =
  | { kind: "mcq"; correct: boolean; correctAnswer: string; explanation: string }
  | { kind: "ai"; evaluation: AnswerEvaluation };

function PracticePage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [type, setType] = useState("all");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [busy, setBusy] = useState(false);
  const grade = useServerFn(evaluateAnswer);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["practice-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (topic === "all" || q.topic === topic) &&
          (difficulty === "all" || q.difficulty === difficulty) &&
          (type === "all" || (q.question_type ?? "conceptual") === type),
      ),
    [questions, topic, difficulty, type],
  );

  useEffect(() => {
    setIndex(0);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, difficulty, type]);

  const question = filtered.length ? filtered[index % filtered.length] : undefined;
  const options = (question?.options as string[] | null) ?? null;
  const isMcq = Boolean(options?.length);

  function reset() {
    setAnswer("");
    setChoice(null);
    setResult(null);
    setShowExplanation(false);
  }

  async function record(score: number, userAnswer: string, feedback: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !question) return;
    await supabase.from("practice_attempts").insert({
      user_id: auth.user.id,
      question_id: question.id,
      category: question.category,
      topic: question.topic,
      question_text: question.question,
      user_answer: userAnswer,
      score,
      feedback,
    });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function submit() {
    if (!question) return;
    setBusy(true);
    try {
      if (isMcq && options) {
        if (choice === null) {
          toast.error("Pick an option first.");
          return;
        }
        const correct = choice === question.correct_option;
        setResult({
          kind: "mcq",
          correct,
          correctAnswer: options[question.correct_option ?? 0] ?? "",
          explanation: question.model_answer ?? "",
        });
        setShowExplanation(true);
        await record(correct ? 100 : 0, options[choice] ?? "", correct ? "Correct" : "Incorrect");
      } else {
        if (answer.trim().length < 10) {
          toast.error("Write a bit more before submitting.");
          return;
        }
        const evaluation = await grade({
          data: {
            question: question.question,
            answer,
            category: question.question_type ?? question.category,
            role: profile?.target_role ?? "Software Engineer",
          },
        });
        setResult({ kind: "ai", evaluation });
        await record(
          Math.max(0, Math.min(100, Math.round(evaluation.score))),
          answer,
          evaluation.verdict,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    reset();
  }

  const relatedConcepts = useMemo(() => {
    if (!question) return [];
    return questions
      .filter((q) => q.topic === question.topic && q.id !== question.id)
      .slice(0, 3)
      .map((q) => q.question);
  }, [questions, question]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Pick a category, difficulty and question type. Answers are graded and saved to your progress.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Question type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {question && <Badge variant="secondary">{question.topic}</Badge>}
            {question && <Badge variant="outline" className="capitalize">{question.difficulty}</Badge>}
            {question && (
              <Badge variant="outline" className="capitalize">
                {TYPES.find((t) => t.value === (question.question_type ?? "conceptual"))?.label ?? "Conceptual"}
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length ? `${(index % filtered.length) + 1} of ${filtered.length}` : "0"}
            </span>
          </div>
          <CardTitle className="text-lg leading-snug">
            {isLoading
              ? "Loading questions…"
              : question?.question ?? "No questions match these filters yet — try widening them."}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMcq && options ? (
            <div className="space-y-2">
              {options.map((opt, i) => {
                const revealed = result?.kind === "mcq";
                const isCorrect = revealed && i === question?.correct_option;
                const isWrongPick = revealed && i === choice && !isCorrect;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed || busy}
                    onClick={() => setChoice(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                      choice === i && !revealed && "border-primary bg-primary/5",
                      isCorrect && "border-success bg-success/10",
                      isWrongPick && "border-destructive bg-destructive/10",
                      !revealed && "hover:bg-muted/60",
                    )}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="min-w-0">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              rows={7}
              placeholder="Type your answer as you would say it in the interview..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!question || busy || Boolean(result)}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={submit} disabled={busy || !question || Boolean(result)}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Submit answer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExplanation((s) => !s)}
              disabled={!question}
            >
              <Lightbulb className="mr-2 h-4 w-4" /> {showExplanation ? "Hide" : "Show"} explanation
            </Button>
            <Button variant="ghost" onClick={nextQuestion} disabled={!filtered.length}>
              <RefreshCw className="mr-2 h-4 w-4" /> Next question
            </Button>
          </div>
        </CardContent>
      </Card>

      {result?.kind === "mcq" && (
        <Card className={result.correct ? "border-success/40" : "border-destructive/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {result.correct ? (
                <><CheckCircle2 className="h-5 w-5 text-success" /> Correct</>
              ) : (
                <><XCircle className="h-5 w-5 text-destructive" /> Incorrect</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Correct answer:</span> {result.correctAnswer}</p>
          </CardContent>
        </Card>
      )}

      {result?.kind === "ai" && (
        <Card className="border-accent/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">AI feedback</CardTitle>
              <span className="text-2xl font-bold text-accent">{Math.round(result.evaluation.score)}%</span>
            </div>
            <Progress value={result.evaluation.score} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="font-medium">{result.evaluation.verdict}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">What worked</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.evaluation.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">Improve</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.evaluation.improvements?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            </div>
            {result.evaluation.model_answer && (
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model answer</p>
                <p>{result.evaluation.model_answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showExplanation && question && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="whitespace-pre-line text-muted-foreground">
              {question.model_answer ?? "No explanation stored for this question yet."}
            </p>
            {relatedConcepts.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Related concepts in {question.topic}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {relatedConcepts.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
