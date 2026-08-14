import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Bookmark, BookmarkCheck, CheckCircle2, Circle, Building2, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/question-bank")({
  head: () => ({
    meta: [
      { title: "Question Bank — InterviewPrep AI" },
      {
        name: "description",
        content:
          "Search, filter, bookmark and tick off curated technical, HR and MCQ interview questions with model answers.",
      },
      { property: "og:title", content: "Question Bank — InterviewPrep AI" },
      { property: "og:description", content: "Curated interview questions with model answers, bookmarks and progress." },
    ],
  }),
  component: QuestionBankPage,
});

const ALL = "all";

function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [type, setType] = useState(ALL);

  const { data: questions = [] } = useQuery({
    queryKey: ["question-bank"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("topic");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: marks = [] } = useQuery({
    queryKey: ["user-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_questions").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const markMap = useMemo(
    () => new Map(marks.map((m) => [m.question_id, m])),
    [marks],
  );

  const toggle = useMutation({
    mutationFn: async ({ id, field }: { id: string; field: "bookmarked" | "completed" }) => {
      const userId = (await supabase.auth.getUser()).data.user!.id;
      const current = markMap.get(id);
      const { error } = await supabase.from("user_questions").upsert(
        {
          user_id: userId,
          question_id: id,
          bookmarked: field === "bookmarked" ? !current?.bookmarked : (current?.bookmarked ?? false),
          completed: field === "completed" ? !current?.completed : (current?.completed ?? false),
        },
        { onConflict: "user_id,question_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-questions"] }),
  });

  const skills = useMemo(
    () => Array.from(new Set(questions.map((q) => q.topic))).sort(),
    [questions],
  );
  const types = useMemo(
    () => Array.from(new Set(questions.map((q) => q.question_type))).sort(),
    [questions],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return questions.filter((q) => {
      const mark = markMap.get(q.id);
      if (view === "bookmarked" && !mark?.bookmarked) return false;
      if (view === "completed" && !mark?.completed) return false;
      if (skill !== ALL && q.topic !== skill) return false;
      if (difficulty !== ALL && q.difficulty !== difficulty) return false;
      if (type !== ALL && q.question_type !== type) return false;
      return q.question.toLowerCase().includes(term) || q.topic.toLowerCase().includes(term);
    });
  }, [questions, markMap, view, skill, difficulty, type, search]);

  const bookmarkedCount = marks.filter((m) => m.bookmarked).length;
  const completedCount = marks.filter((m) => m.completed).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Search, filter and bookmark curated questions — tick them off as you master each one.
        </p>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="all">All ({questions.length})</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked ({bookmarkedCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search questions or topics"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={skill} onValueChange={setSkill}>
          <SelectTrigger>
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All skills</SelectItem>
            {skills.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any level</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any type</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          {filtered.length ? (
            <Accordion type="single" collapsible>
              {filtered.map((q) => {
                const mark = markMap.get(q.id);
                return (
                  <AccordionItem key={q.id} value={q.id}>
                    <div className="flex items-start gap-1">
                      <AccordionTrigger className="text-left text-sm">
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5 pr-3">
                          <span className="min-w-0 font-medium">{q.question}</span>
                          <span className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary">{q.topic}</Badge>
                            <Badge variant="outline">{q.difficulty}</Badge>
                            <Badge variant="outline">{q.question_type}</Badge>
                            {q.frequently_asked && (
                              <Badge className="gap-1">
                                <Flame className="h-3 w-3" /> Frequently asked
                              </Badge>
                            )}
                            {q.companies?.length > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <Building2 className="h-3 w-3" /> {q.companies.join(", ")}
                              </Badge>
                            )}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <div className="flex shrink-0 items-center gap-0.5 pt-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={mark?.bookmarked ? "Remove bookmark" : "Bookmark question"}
                          onClick={() => toggle.mutate({ id: q.id, field: "bookmarked" })}
                        >
                          {mark?.bookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-accent" />
                          ) : (
                            <Bookmark className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={mark?.completed ? "Mark as not completed" : "Mark as completed"}
                          onClick={() => toggle.mutate({ id: q.id, field: "completed" })}
                        >
                          {mark?.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <ul className="space-y-1">
                          {(q.options as string[]).map((o, i) => (
                            <li key={i} className={i === q.correct_option ? "text-success" : ""}>
                              {String.fromCharCode(65 + i)}. {o}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p>{q.model_answer ?? "No model answer recorded for this question yet."}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">No questions match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
