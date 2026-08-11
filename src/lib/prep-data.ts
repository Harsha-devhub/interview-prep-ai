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
