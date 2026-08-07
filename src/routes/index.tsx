import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Mic,
  ClipboardCheck,
  LineChart,
  Map as MapIcon,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewPrep AI — Land your first tech job" },
      {
        name: "description",
        content:
          "AI-powered interview preparation for students and fresh graduates: practice questions, mock interviews, assessments and a personalised roadmap.",
      },
      { property: "og:title", content: "InterviewPrep AI — Land your first tech job" },
      {
        property: "og:description",
        content: "Practice technical and HR interviews with an AI coach and track your readiness.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: Sparkles, title: "AI-graded practice", desc: "Answer real questions and get scored feedback in seconds." },
  { icon: Mic, title: "Mock interviews", desc: "An adaptive AI panel that follows up on what you actually said." },
  { icon: ClipboardCheck, title: "Timed assessments", desc: "MCQ rounds by topic, scored and reviewed instantly." },
  { icon: BookOpen, title: "Question bank", desc: "Curated technical and HR questions with model answers." },
  { icon: LineChart, title: "Progress tracking", desc: "Watch your readiness score and weak topics move." },
  { icon: MapIcon, title: "Personal roadmap", desc: "A four-week plan built around your gaps, not generic advice." },
];

function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const cta = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </span>
          <span className="truncate font-display text-lg font-bold">InterviewPrep AI</span>
        </span>
        <Button asChild size="sm">
          <Link to={cta}>{signedIn ? "Dashboard" : "Sign in"}</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full">
              Built for students and fresh graduates
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Walk into your interview already having done it.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Practice technical and HR questions, sit full AI-led mock interviews, and get an honest
              readiness score with a plan to close every gap.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link to={cta}>
                  Start preparing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="card-hover">
                <CardContent className="p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10">
                    <f.icon className="h-5 w-5 text-accent" />
                  </span>
                  <p className="mt-4 font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="gradient-brand rounded-3xl px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
              Your first interview shouldn't be your first practice.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/70">
              Create a free account and run your first AI mock interview in under two minutes.
            </p>
            <Button asChild variant="secondary" size="lg" className="mt-7">
              <Link to={cta}>Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        InterviewPrep AI — practice, feedback and progress in one place.
      </footer>
    </div>
  );
}
