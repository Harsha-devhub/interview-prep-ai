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
        content: `You are conducting a ${data.interviewType} mock interview for a ${data.role} role with a fresh graduate. Ask ONE question at a time, building naturally on previous answers. Ask a maximum of 6 questions in total. Respond ONLY with JSON: {"question": string, "done": boolean}. Set done=true and leave question empty once 6 questions have been asked.`,
      },
      {
        role: "user",
        content: `Questions asked so far: ${asked}.\nTranscript:\n${
          data.transcript.map((t) => `${t.role}: ${t.content}`).join("\n") || "(interview just started)"
        }`,
      },
    ]);
  });

export type InterviewReport = {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  areas: Array<{ name: string; score: number }>;
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
          "You are an interview panel giving structured feedback. Respond ONLY with JSON: {\"overall_score\": number 0-100, \"summary\": string, \"strengths\": string[], \"improvements\": string[], \"areas\": [{\"name\": string, \"score\": number}]}. Areas should cover Technical Depth, Communication, Problem Solving and Confidence.",
      },
      {
        role: "user",
        content: `Role: ${data.role}\nTranscript:\n${data.transcript
          .map((t) => `${t.role}: ${t.content}`)
          .join("\n")}`,
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
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAIJson<Roadmap>([
      {
        role: "system",
        content:
          "You build 4-week interview preparation roadmaps for students. Respond ONLY with JSON: {\"focus\": string, \"weeks\": [{\"week\": number, \"theme\": string, \"goals\": string[], \"resources\": string[]}]}. Exactly 4 weeks, 3-5 goals each.",
      },
      {
        role: "user",
        content: `Target role: ${data.role}\nLevel: ${data.experienceLevel}\nSkills: ${
          data.skills.join(", ") || "not specified"
        }\nWeak topics from recent practice: ${data.weakTopics.join(", ") || "none recorded yet"}`,
      },
    ]);
  });
