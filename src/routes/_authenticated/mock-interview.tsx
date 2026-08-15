import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mic, Send, Bot, User, SkipForward, Clock, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import {
  nextInterviewQuestion,
  gradeInterview,
  type InterviewTurn,
  type InterviewReport,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/mock-interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview — InterviewPrep AI" },
      {
        name: "description",
        content: "Sit a realistic AI-led mock interview with adaptive follow-ups and a full panel report at the end.",
      },
      { property: "og:title", content: "AI Mock Interview — InterviewPrep AI" },
      { property: "og:description", content: "Adaptive AI mock interviews with a scored panel report." },
    ],
  }),
  component: MockInterviewPage,
});

const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical Interview" },
  { value: "hr", label: "HR Interview" },
  { value: "behavioral", label: "Behavioral Interview" },
  { value: "mixed", label: "Mixed Interview" },
];

const INTERVIEW_ROLES = [
  "Java Developer",
  "Full Stack Developer",
  "Python Developer",
  "Data Analyst",
  "Data Scientist",
  "ML Engineer",
  "Frontend Developer",
  "Backend Developer",
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DURATIONS = [
  { value: 10, label: "10 minutes", questions: 5 },
  { value: 20, label: "20 minutes", questions: 8 },
  { value: 30, label: "30 minutes", questions: 10 },
];

function formatClock(seconds: number) {
  const m = Math.floor(Math.max(seconds, 0) / 60);
  const s = Math.max(seconds, 0) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MockInterviewPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const askNext = useServerFn(nextInterviewQuestion);
  const grade = useServerFn(gradeInterview);

  const [role, setRole] = useState<string>("");
  const [type, setType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [duration, setDuration] = useState(20);

  const [transcript, setTranscript] = useState<InterviewTurn[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [remaining, setRemaining] = useState(duration * 60);

  const endedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRole = role || (INTERVIEW_ROLES.includes(profile?.target_role ?? "") ? profile!.target_role! : "");
  const totalQuestions = useMemo(
    () => DURATIONS.find((d) => d.value === duration)?.questions ?? 8,
    [duration],
  );
  const asked = transcript.filter((t) => t.role === "interviewer").length;

  useEffect(() => {
    if (!started || report) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!endedRef.current) {
            endedRef.current = true;
            void finish(transcriptRef.current);
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, report]);

  const transcriptRef = useRef<InterviewTurn[]>([]);
  useEffect(() => {
    transcriptRef.current = transcript;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  async function start() {
    if (!activeRole) {
      toast.error("Pick the role you want to be interviewed for.");
      return;
    }
    setBusy(true);
    try {
      const res = await askNext({
        data: { role: activeRole, interviewType: type, difficulty, totalQuestions, transcript: [] },
      });
      setTranscript([{ role: "interviewer", content: res.question }]);
      setStarted(true);
      setReport(null);
      setRemaining(duration * 60);
      endedRef.current = false;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the interview.");
    } finally {
      setBusy(false);
    }
  }

  async function advance(updated: InterviewTurn[]) {
    setTranscript(updated);
    setBusy(true);
    try {
      const res = await askNext({
        data: { role: activeRole, interviewType: type, difficulty, totalQuestions, transcript: updated },
      });
      const answered = updated.filter((t) => t.role === "candidate").length;
      if (res.done || !res.question || answered >= totalQuestions) {
        endedRef.current = true;
        await finish(updated);
      } else {
        setTranscript([...updated, { role: "interviewer", content: res.question }]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The interviewer lost connection.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (reply.trim().length < 5) {
      toast.error("Give a fuller answer before continuing.");
      return;
    }
    const updated: InterviewTurn[] = [...transcript, { role: "candidate", content: reply }];
    setReply("");
    await advance(updated);
  }

  async function skip() {
    const updated: InterviewTurn[] = [
      ...transcript,
      { role: "candidate", content: "(skipped this question)" },
    ];
    setReply("");
    await advance(updated);
  }

  async function finish(final: InterviewTurn[]) {
    endedRef.current = true;
    setBusy(true);
    try {
      const result = await grade({ data: { role: activeRole, transcript: final } });
      setReport(result);
      const userId = (await supabase.auth.getUser()).data.user!.id;
      await supabase.from("mock_interviews").insert({
        user_id: userId,
        role: activeRole,
        interview_type: type,
        transcript: final,
        overall_score: Math.max(0, Math.min(100, Math.round(result.overall_score))),
        feedback: result,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Mock Interview</h1>
        <p className="text-sm text-muted-foreground">
          A realistic AI-led round with adaptive follow-ups. Your evaluation arrives at the end, not after each answer.
        </p>
      </div>

      {!started ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set up your round</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Interview type</p>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Role</p>
                <Select value={activeRole} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Difficulty</p>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Interview duration</p>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label} · {d.questions} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={start} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              Start interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">AI Interviewer</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {activeRole} · {INTERVIEW_TYPES.find((t) => t.value === type)?.label} · {difficulty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" /> {formatClock(remaining)}
                  </Badge>
                  <Badge variant="secondary">
                    Question {Math.min(asked, totalQuestions)} of {totalQuestions}
                  </Badge>
                </div>
              </div>
              <Progress value={(Math.min(asked, totalQuestions) / totalQuestions) * 100} className="h-1.5" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div ref={scrollRef} className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {transcript.map((turn, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        turn.role === "interviewer" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {turn.role === "interviewer" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {turn.role === "interviewer" ? "AI Interviewer" : "Candidate"}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          turn.role === "interviewer" ? "bg-secondary" : "bg-accent/10"
                        }`}
                      >
                        {turn.content}
                      </div>
                    </div>
                  </div>
                ))}
                {busy && !report && (
                  <p className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> The interviewer is thinking...
                  </p>
                )}
              </div>

              {!report && (
                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    rows={4}
                    placeholder="Type your answer..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={busy}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={send} disabled={busy}>
                      <Send className="mr-2 h-4 w-4" /> Submit answer
                    </Button>
                    <Button variant="secondary" onClick={skip} disabled={busy}>
                      <SkipForward className="mr-2 h-4 w-4" /> Skip question
                    </Button>
                    <Button variant="outline" onClick={() => finish(transcript)} disabled={busy}>
                      <Square className="mr-2 h-4 w-4" /> End interview
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {report && (
            <>
              <Card className="border-accent/30">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">Interview evaluation</CardTitle>
                    <span className="text-3xl font-bold text-accent">
                      {Math.round(report.overall_score)}
                      <span className="text-base text-muted-foreground">/100</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <p>{report.summary}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {report.areas?.map((a) => (
                      <div key={a.name}>
                        <div className="flex justify-between text-sm">
                          <span>{a.name}</span>
                          <span className="text-muted-foreground">{a.score}</span>
                        </div>
                        <Progress value={a.score} className="mt-1.5 h-1.5" />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-success/5 p-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">
                        What you did well
                      </p>
                      <ul className="space-y-1 text-muted-foreground">
                        {report.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-warning/5 p-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                        What you should improve
                      </p>
                      <ul className="space-y-1 text-muted-foreground">
                        {report.improvements?.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {report.answer_analysis?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Answer analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {report.answer_analysis.map((a, i) => (
                      <div key={i} className="rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">
                            Q{i + 1}. {a.question}
                          </p>
                          <Badge variant="secondary" className="shrink-0">
                            {Math.round(a.score)}/100
                          </Badge>
                        </div>
                        <p className="mt-2 rounded-xl bg-muted/60 p-3 text-muted-foreground">{a.answer}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-success">Strengths</p>
                            <ul className="mt-1 space-y-1 text-muted-foreground">
                              {a.strengths?.map((s, j) => <li key={j}>• {s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                              Areas for improvement
                            </p>
                            <ul className="mt-1 space-y-1 text-muted-foreground">
                              {a.improvements?.map((s, j) => <li key={j}>• {s}</li>)}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl bg-accent/5 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Ideal answer</p>
                          <p className="mt-1 text-muted-foreground">{a.ideal_answer}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="gradient-brand border-0">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wide text-primary-foreground/60">
                    Final recommendation
                  </p>
                  <p className="mt-1 text-primary-foreground">{report.recommendation}</p>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => {
                  setStarted(false);
                  setTranscript([]);
                  setReport(null);
                  endedRef.current = false;
                }}
              >
                Run another interview
              </Button>
            </>
          )}

        </>
      )}
    </div>
  );
}
