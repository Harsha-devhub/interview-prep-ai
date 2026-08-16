import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIJson } from "./ai-gateway.server";

export type AnswerEvaluation = {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  model_answer: string;
};

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(1),
        answer: z.string().min(1),
        category: z.string().default("technical"),
        role: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAIJson<AnswerEvaluation>([
      {
        role: "system",
        content:
          "You are a senior interview coach for college students and fresh graduates. Grade answers honestly but encouragingly. Respond ONLY with JSON: {\"score\": number 0-100, \"verdict\": short one-line summary, \"strengths\": string[], \"improvements\": string[], \"model_answer\": a concise ideal answer}.",
      },
      {
        role: "user",
        content: `Category: ${data.category}\nTarget role: ${data.role ?? "general"}\nQuestion: ${data.question}\n\nCandidate answer: ${data.answer}`,
      },
    ]);
  });

export type InterviewTurn = { role: "interviewer" | "candidate"; content: string };

export const nextInterviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        role: z.string().min(1),
        interviewType: z.string().default("mixed"),
        difficulty: z.string().default("intermediate"),
        totalQuestions: z.number().min(3).max(20).default(6),
        transcript: z
          .array(z.object({ role: z.enum(["interviewer", "candidate"]), content: z.string() }))
          .default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const asked = data.transcript.filter((t) => t.role === "interviewer").length;
    return callAIJson<{ question: string; done: boolean }>([
      {
        role: "system",
        content: `You are conducting a ${data.interviewType} mock interview for a ${data.role} role at ${data.difficulty} difficulty with a fresh graduate. Ask ONE question at a time. Analyse the candidate's previous answer silently and ask a relevant follow-up that builds on it; move to a new area when a thread is exhausted. Never reveal scores, evaluation or feedback during the interview. Ask a maximum of ${data.totalQuestions} questions in total. Respond ONLY with JSON: {"question": string, "done": boolean}. Set done=true and leave question empty once ${data.totalQuestions} questions have been asked.`,
      },
      {
        role: "user",
        content: `Questions asked so far: ${asked}.\nTranscript:\n${
          data.transcript.map((t) => `${t.role}: ${t.content}`).join("\n") || "(interview just started)"
        }`,
      },
    ]);
  });

export type AnswerAnalysis = {
  question: string;
  answer: string;
  score: number;
  strengths: string[];
  improvements: string[];
  ideal_answer: string;
};

export type InterviewReport = {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  areas: Array<{ name: string; score: number }>;
  answer_analysis: AnswerAnalysis[];
  recommendation: string;
};

export const gradeInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        role: z.string().min(1),
        transcript: z.array(
          z.object({ role: z.enum(["interviewer", "candidate"]), content: z.string() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAIJson<InterviewReport>([
      {
        role: "system",
        content:
          'You are an interview panel giving a detailed, honest but encouraging evaluation. Respond ONLY with JSON: {"overall_score": number 0-100, "summary": string, "strengths": string[], "improvements": string[], "areas": [{"name": string, "score": number}], "answer_analysis": [{"question": string, "answer": string, "score": number 0-100, "strengths": string[], "improvements": string[], "ideal_answer": string}], "recommendation": string}. "areas" MUST contain exactly these five names in this order: Technical Knowledge, Communication, Relevance, Confidence, Problem Solving. "answer_analysis" MUST contain one entry per interviewer question that the candidate answered, quoting the question and the candidate answer verbatim (truncate long answers). "recommendation" is a 1-2 sentence final recommendation naming the readiness level (beginner/intermediate/advanced) and the exact topics to focus on before the next mock interview.',
      },
      {
        role: "user",
        content: `Role: ${data.role}\nTranscript:\n${data.transcript
          .map((t) => `${t.role}: ${t.content}`)
          .join("\n")}`,
      },
    ]);
  });

export type HrEvaluation = {
  overall_score: number;
  verdict: string;
  dimensions: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  improvements: string[];
  model_answer: string;
};

export const evaluateHrAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(1),
        answer: z.string().min(1),
        role: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAIJson<HrEvaluation>([
      {
        role: "system",
        content:
          'You are an HR interviewer coaching a fresh graduate. Respond ONLY with JSON: {"overall_score": number 0-100, "verdict": one-line summary, "dimensions": [{"name": string, "score": number 0-100, "comment": one actionable sentence}], "strengths": string[], "improvements": string[], "model_answer": a concise strong sample answer}. "dimensions" MUST contain exactly these six names in this order: Relevance, Structure, Clarity, Professionalism, Confidence, Conciseness. Feedback must be specific and actionable, never generic.',
      },
      {
        role: "user",
        content: `Target role: ${data.role ?? "general"}\nHR question: ${data.question}\n\nCandidate answer: ${data.answer}`,
      },
    ]);
  });

export type Roadmap = {
  focus: string;
  weeks: Array<{ week: number; theme: string; goals: string[]; resources: string[] }>;
};

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        role: z.string().default("Software Engineer"),
        skills: z.array(z.string()).default([]),
        weakTopics: z.array(z.string()).default([]),
        experienceLevel: z.string().default("fresher"),
        durationDays: z.number().min(7).max(120).default(30),
        assessmentSummary: z.string().default(""),
        interviewSummary: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const weeks = Math.max(1, Math.min(12, Math.round(data.durationDays / 7)));
    return callAIJson<Roadmap>([
      {
        role: "system",
        content: `You build interview preparation roadmaps for students. Respond ONLY with JSON: {"focus": string, "weeks": [{"week": number, "theme": string, "goals": string[], "resources": string[]}]}. Produce exactly ${weeks} week(s), 4-6 concrete goals each and 2-4 resources each. Front-load the candidate's weak topics, and reserve the final week for mock interviews and HR preparation.`,
      },
      {
        role: "user",
        content: `Target role: ${data.role}\nLevel: ${data.experienceLevel}\nPreparation duration: ${data.durationDays} days\nSkills: ${
          data.skills.join(", ") || "not specified"
        }\nWeak topics from recent practice: ${data.weakTopics.join(", ") || "none recorded yet"}\nAssessment results: ${
          data.assessmentSummary || "none yet"
        }\nMock interview results: ${data.interviewSummary || "none yet"}`,
      },
    ]);
  });


export type CareerAnswer = {
  answer: string;
  key_points: string[];
  next_actions: string[];
};

export const careerAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ question: z.string().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [profileRes, attemptsRes, assessmentsRes, interviewsRes] = await Promise.all([
      sb.from("profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      sb
        .from("practice_attempts")
        .select("topic, category, score, created_at")
        .order("created_at", { ascending: false })
        .limit(60),
      sb
        .from("assessment_results")
        .select("topic, score, correct_answers, total_questions, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("mock_interviews")
        .select("role, interview_type, overall_score, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const profile = profileRes.data;
    const attempts = attemptsRes.data ?? [];
    const assessments = assessmentsRes.data ?? [];
    const interviews = interviewsRes.data ?? [];

    const byTopic = new Map<string, { total: number; count: number }>();
    for (const a of attempts) {
      const key = a.topic ?? "General";
      const e = byTopic.get(key) ?? { total: 0, count: 0 };
      e.total += a.score ?? 0;
      e.count += 1;
      byTopic.set(key, e);
    }
    const topicLine =
      [...byTopic.entries()]
        .map(([t, v]) => `${t}: ${Math.round(v.total / v.count)}% over ${v.count} answers`)
        .join("; ") || "no practice answers yet";

    const profileLine = profile
      ? `Name: ${profile.full_name ?? "unknown"}; Target role: ${profile.target_role ?? "not set"}; Level: ${
          profile.experience_level
        }; Skills: ${(profile.skills ?? []).join(", ") || "none listed"}; College: ${
          profile.college ?? "unknown"
        }; Graduation year: ${profile.graduation_year ?? "unknown"}; Preparation window: ${
          profile.prep_duration_days ?? 30
        } days`
      : "no profile saved yet";

    return callAIJson<CareerAnswer>([
      {
        role: "system",
        content:
          'You are the personal AI career coach inside an interview preparation app. You are given the student\'s real profile and performance data. Ground EVERY answer in that data: cite their actual scores, weak topics and target role, and never give generic advice that ignores it. If data is missing, say what they should complete first. Respond ONLY with JSON: {"answer": 2-5 short paragraphs of markdown-free plain text, "key_points": string[] of 3-5 data-grounded observations, "next_actions": string[] of 3-5 concrete next steps with topics and counts}.',
      },
      {
        role: "user",
        content: `STUDENT PROFILE\n${profileLine}\n\nPRACTICE PERFORMANCE BY TOPIC\n${topicLine}\n\nASSESSMENTS\n${
          assessments
            .map((a) => `${a.topic}: ${a.score}% (${a.correct_answers}/${a.total_questions})`)
            .join("; ") || "none taken"
        }\n\nMOCK INTERVIEWS\n${
          interviews
            .map((i) => `${i.interview_type} for ${i.role}: ${i.overall_score ?? "not graded"}`)
            .join("; ") || "none completed"
        }\n\nQUESTION: ${data.question}`,
      },
    ]);
  });
