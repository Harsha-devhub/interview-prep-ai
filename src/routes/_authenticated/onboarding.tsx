import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { TARGET_ROLES, SKILLS, EXPERIENCE_LEVELS, PREP_DURATIONS } from "@/lib/prep-data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — InterviewPrep AI" },
      { name: "description", content: "Tell us your target role, skills and timeline to personalise your prep." },
      { property: "og:title", content: "Get started — InterviewPrep AI" },
      { property: "og:description", content: "Personalise your interview preparation in four quick steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const STEP_TITLES = [
  "What role are you preparing for?",
  "What are your strongest skills?",
  "What is your experience level?",
  "What is your target preparation duration?",
];

function OptionTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition-all hover:border-accent/60 hover:shadow-sm",
        selected ? "border-accent bg-accent/10 font-medium" : "border-border bg-card",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        {children}
        {selected && <Check className="h-4 w-4 shrink-0 text-accent" />}
      </span>
    </button>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(profile?.target_role ?? "");
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [level, setLevel] = useState(profile?.experience_level ?? "beginner");
  const [duration, setDuration] = useState<number | null>(profile?.prep_duration_days ?? null);
  const [busy, setBusy] = useState(false);

  const canContinue =
    (step === 0 && !!role) ||
    (step === 1 && skills.length > 0) ||
    (step === 2 && !!level) ||
    (step === 3 && duration !== null);

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function finish() {
    setBusy(true);
    try {
      await update.mutateAsync({
        target_role: role,
        skills,
        experience_level: level,
        prep_duration_days: duration,
        onboarding_completed: true,
      });
      toast.success("Your prep plan is personalised.");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your preferences.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </span>
        <p className="font-display text-lg font-bold">Let's personalise your prep</p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of 4</span>
          <span>{Math.round(((step + 1) / 4) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / 4) * 100} className="mt-2 h-2" />
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h1 className="font-display text-2xl font-bold">{STEP_TITLES[step]}</h1>

          {step === 0 && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {TARGET_ROLES.map((r) => (
                <OptionTile key={r} selected={role === r} onClick={() => setRole(r)}>
                  {r}
                </OptionTile>
              ))}
            </div>
          )}

          {step === 1 && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Select as many as apply.</p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                {SKILLS.map((s) => (
                  <OptionTile key={s} selected={skills.includes(s)} onClick={() => toggleSkill(s)}>
                    {s}
                  </OptionTile>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              {EXPERIENCE_LEVELS.map((l) => (
                <OptionTile key={l.value} selected={level === l.value} onClick={() => setLevel(l.value)}>
                  {l.label}
                </OptionTile>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {PREP_DURATIONS.map((d) => (
                <OptionTile key={d.value} selected={duration === d.value} onClick={() => setDuration(d.value)}>
                  <span>
                    <span className="block font-semibold">{d.label}</span>
                    <span className="block text-xs text-muted-foreground">{d.desc}</span>
                  </span>
                </OptionTile>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!canContinue || busy}>
                Finish setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
