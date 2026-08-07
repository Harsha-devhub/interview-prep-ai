export const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "QA Engineer",
  "Product Analyst",
];

export const SKILLS = [
  "Java",
  "Python",
  "C++",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "Data Structures",
  "Algorithms",
  "DBMS",
  "Operating Systems",
  "Networking",
  "OOP",
  "System Design",
  "Git",
  "Cloud",
  "Machine Learning",
];

export const EXPERIENCE_LEVELS = [
  { value: "student", label: "College student" },
  { value: "fresher", label: "Fresh graduate" },
  { value: "junior", label: "0-2 years experience" },
];

export function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}
