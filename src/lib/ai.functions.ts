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

