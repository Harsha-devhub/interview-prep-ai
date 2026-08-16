export const TARGET_ROLES = [
  "Software Developer",
  "Java Developer",
  "Python Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "QA Engineer",
  "DevOps Engineer",
];

export const SKILLS = [
  "Java",
  "Python",
  "C",
  "C++",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "MongoDB",
  "Data Structures",
  "Algorithms",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Machine Learning",
];

export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const PREP_DURATIONS = [
  { value: 7, label: "7 days", desc: "Interview next week" },
  { value: 30, label: "30 days", desc: "A focused month" },
  { value: 60, label: "60 days", desc: "Steady, thorough prep" },
  { value: 90, label: "90 days", desc: "Full placement season" },
];

export function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export const HR_QUESTIONS = [
  { topic: "Self Introduction", question: "Tell me about yourself." },
  { topic: "Motivation", question: "Why should we hire you?" },
  { topic: "Strengths", question: "What are your strengths?" },
  { topic: "Weaknesses", question: "What are your weaknesses?" },
  { topic: "Company Fit", question: "Why do you want to join our company?" },
  { topic: "Career Goals", question: "Where do you see yourself in five years?" },
  { topic: "Resilience", question: "Tell me about a difficult situation you faced and how you handled it." },
  { topic: "Motivation", question: "Why should we select you over other candidates?" },
  { topic: "Teamwork", question: "Describe a time you worked in a team and disagreed with someone." },
  { topic: "Failure", question: "Tell me about a time you failed. What did you learn?" },
  { topic: "Workplace Fit", question: "Are you willing to relocate or work in shifts? Why?" },
  { topic: "Self Awareness", question: "How do you handle pressure and tight deadlines?" },
];

export const HR_DIMENSIONS = [
  "Relevance",
  "Structure",
  "Clarity",
  "Professionalism",
  "Confidence",
  "Conciseness",
];
