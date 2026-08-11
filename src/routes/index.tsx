import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Mic,
  ClipboardCheck,
  LineChart,
  MessageSquareHeart,
  BookOpen,
  Target,
  ArrowRight,
  Brain,
  ListChecks,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewPrep AI — Prepare Smarter. Interview Better." },
      {
        name: "description",
        content:
          "Practice technical and HR interviews, sit AI mock interviews, take MCQ assessments and get AI feedback that closes your weak areas.",
      },
      { property: "og:title", content: "InterviewPrep AI — Prepare Smarter. Interview Better." },
      {
        property: "og:description",
        content: "AI mock interviews, technical practice and progress analytics for students and fresh graduates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: Mic, title: "AI Mock Interviews", desc: "An adaptive AI panel that asks follow-ups based on what you actually said." },
  { icon: BookOpen, title: "Technical Practice", desc: "Role-specific DSA, DBMS, OS, networking and language questions." },
  { icon: MessageSquareHeart, title: "HR Interview Preparation", desc: "Behavioural and situational questions with structured answer frameworks." },
  { icon: ClipboardCheck, title: "Coding & MCQ Assessments", desc: "Timed rounds by topic, scored instantly with explanations." },
  { icon: Sparkles, title: "Personalized Feedback", desc: "Every answer graded with strengths, gaps and a model answer." },
  { icon: LineChart, title: "Progress Analytics", desc: "Readiness score, topic breakdowns and weak-area tracking over time." },
];

const STEPS = [
  { icon: Target, title: "Choose your target role", desc: "Tell us the job you're preparing for." },
  { icon: Brain, title: "Practice relevant questions", desc: "Curated technical and HR sets for that role." },
  { icon: Mic, title: "Take mock interviews", desc: "Full AI-led rounds that mirror the real thing." },
  { icon: ListChecks, title: "Receive AI feedback", desc: "Scores, strengths and precise improvements." },
  { icon: Repeat, title: "Improve your weak areas", desc: "A roadmap that keeps updating as you grow." },
];

const STATS = [
  { value: "10,000+", label: "Practice Questions" },
  { value: "5,000+", label: "Students" },
  { value: "50+", label: "Job Roles" },
  { value: "AI-Powered", label: "Feedback" },
];

function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const cta = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="truncate font-display text-lg font-bold">InterviewPrep AI</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#stats" className="transition-colors hover:text-foreground">Why us</a>
          </nav>
          <Button asChild size="sm">
            <Link to={cta}>{signedIn ? "Dashboard" : "Sign in"}</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full">
              Built for students and fresh graduates
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Prepare Smarter. Interview Better.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Practice technical interviews, simulate real interview experiences, and get AI-powered
              feedback to improve your chances of landing your dream job.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={cta}>
                  Start Preparing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="stats" className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid gap-4 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-accent">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Demo statistics shown for illustration only.
          </p>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="font-display text-3xl font-bold tracking-tight">Everything you need to get hired</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            One place to practise, be assessed honestly, and fix what's actually holding you back.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <section id="how-it-works" className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Five steps from unsure to interview-ready.</p>
            <ol className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <s.icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="mt-3 font-semibold leading-snug">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="gradient-brand rounded-3xl px-6 py-14 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-primary-foreground/70" />
            <h2 className="mt-4 font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
              Your first interview shouldn't be your first practice.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/70">
              Create a free account and run your first AI mock interview in under two minutes.
            </p>
            <Button asChild variant="secondary" size="lg" className="mt-7">
              <Link to={cta}>Start Preparing</Link>
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
