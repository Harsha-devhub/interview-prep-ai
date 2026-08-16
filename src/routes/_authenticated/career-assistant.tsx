import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { careerAdvice, type CareerAnswer } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/career-assistant")({
  head: () => ({
    meta: [
      { title: "AI Career Assistant — InterviewPrep AI" },
      {
        name: "description",
        content:
          "Ask the AI career coach what to study next, why your interview scores are low, or for a personalised preparation plan based on your own results.",
      },
      { property: "og:title", content: "AI Career Assistant — InterviewPrep AI" },
      { property: "og:description", content: "Career guidance grounded in your own performance data." },
    ],
  }),
  component: CareerAssistantPage,
});

const SUGGESTIONS = [
  "What should I study next?",
  "Why am I getting low scores in interviews?",
  "What skills should I improve for a Java developer role?",
  "Give me a 30-day preparation plan.",
  "Am I ready for campus placements?",
];

type Entry = { question: string; answer: CareerAnswer };

function CareerAssistantPage() {
  const ask = useServerFn(careerAdvice);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);

  async function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setBusy(true);
    setQuestion("");
    try {
      const answer = await ask({ data: { question: q } });
      setEntries((e) => [...e, { question: q, answer }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The coach could not answer right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Career Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Every answer is based on your profile, practice scores, assessments and mock interviews.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => send(s)}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1.5 text-xs font-normal">
              {s}
            </Badge>
          </button>
        ))}
      </div>

      {entries.length === 0 && !busy && (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Ask your first question</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The coach reads your saved results before replying, so the more you practise the sharper the advice.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="flex max-w-[85%] items-start gap-2 rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                <span>{entry.question}</span>
                <User className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
              </div>
            </div>
            <Card>
              <CardContent className="space-y-4 p-5 text-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary" /> Career coach
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{entry.answer.answer}</p>
                {entry.answer.key_points?.length > 0 && (
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      From your data
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      {entry.answer.key_points.map((k, j) => (
                        <li key={j}>• {k}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.answer.next_actions?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Do this next
                    </p>
                    <ul className="space-y-1">
                      {entry.answer.next_actions.map((a, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-primary">{j + 1}.</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        {busy && (
          <Card>
            <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your results…
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="sticky bottom-4">
        <CardContent className="flex items-end gap-2 p-3">
          <Textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }}
            placeholder="Ask about your preparation…"
            className="min-h-0 resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <Button size="icon" disabled={busy} onClick={() => send(question)}>
            <Send className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
