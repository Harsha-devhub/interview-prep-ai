import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mic, Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { TARGET_ROLES } from "@/lib/prep-data";
import {
  nextInterviewQuestion,
  gradeInterview,
  type InterviewTurn,
  type InterviewReport,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/mock-interview")({
  head: () => ({
    meta: [
      { title: "Mock Interview — InterviewPrep AI" },
      { name: "description", content: "Sit a full AI-led mock interview and get a scored panel report." },
      { property: "og:title", content: "Mock Interview — InterviewPrep AI" },
      { property: "og:description", content: "Sit a full AI-led mock interview and get a scored report." },
    ],
  }),
  component: MockInterviewPage,
});

function MockInterviewPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const askNext = useServerFn(nextInterviewQuestion);
  const grade = useServerFn(gradeInterview);

  const [role, setRole] = useState<string>("");
  const [type, setType] = useState("mixed");
  const [transcript, setTranscript] = useState<InterviewTurn[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const activeRole = role || profile?.target_role || "Software Engineer";
  const asked = transcript.filter((t) => t.role === "interviewer").length;

  async function start() {
    setBusy(true);
    try {
      const res = await askNext({ data: { role: activeRole, interviewType: type, transcript: [] } });
      setTranscript([{ role: "interviewer", content: res.question }]);
      setStarted(true);
      setReport(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the interview.");
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
    setTranscript(updated);
    setReply("");
    setBusy(true);
    try {
      const res = await askNext({ data: { role: activeRole, interviewType: type, transcript: updated } });
      if (res.done || !res.question) {
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

  async function finish(final: InterviewTurn[]) {
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
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-sm text-muted-foreground">
          A six-question AI-led round that adapts to your answers, followed by a panel-style report.
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
                <p className="text-sm font-medium">Target role</p>
                <Select value={activeRole} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Interview type</p>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR / Behavioural</SelectItem>
                    <SelectItem value="mixed">Mixed panel</SelectItem>
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
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{activeRole} · {type}</CardTitle>
              <Badge variant="secondary">Question {Math.min(asked, 6)} of 6</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {transcript.map((turn, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        turn.role === "interviewer" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {turn.role === "interviewer" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </span>
                    <div
                      className={`min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm ${
                        turn.role === "interviewer" ? "bg-secondary" : "bg-accent/10"
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                ))}
                {busy && (
                  <p className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                  </p>
                )}
              </div>

              {!report && (
                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    rows={4}
                    placeholder="Your answer..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={busy}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={send} disabled={busy}>
                      <Send className="mr-2 h-4 w-4" /> Send answer
                    </Button>
                    <Button variant="outline" onClick={() => finish(transcript)} disabled={busy}>
                      End & get report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {report && (
            <Card className="border-accent/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">Panel report</CardTitle>
                  <span className="text-2xl font-bold text-accent">{Math.round(report.overall_score)}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <p>{report.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.areas?.map((a) => (
                    <div key={a.name}>
                      <div className="flex justify-between text-sm">
                        <span>{a.name}</span>
                        <span className="text-muted-foreground">{a.score}%</span>
                      </div>
                      <Progress value={a.score} className="mt-1.5 h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">Strengths</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {report.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">Improve</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {report.improvements?.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStarted(false);
                    setTranscript([]);
                    setReport(null);
                  }}
                >
                  Run another interview
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
