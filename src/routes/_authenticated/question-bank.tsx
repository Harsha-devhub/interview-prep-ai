import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/question-bank")({
  head: () => ({
    meta: [
      { title: "Question Bank — InterviewPrep AI" },
      { name: "description", content: "Browse curated technical, HR and MCQ interview questions with model answers." },
      { property: "og:title", content: "Question Bank — InterviewPrep AI" },
      { property: "og:description", content: "Curated interview questions with model answers." },
    ],
  }),
  component: QuestionBankPage,
});

function QuestionBankPage() {
  const [category, setCategory] = useState("technical");
  const [search, setSearch] = useState("");

  const { data: questions = [] } = useQuery({
    queryKey: ["question-bank"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("topic");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.category === category &&
          (q.question.toLowerCase().includes(search.toLowerCase()) ||
            q.topic.toLowerCase().includes(search.toLowerCase())),
      ),
    [questions, category, search],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Curated questions with model answers you can study before a round.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="mcq">MCQ</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search questions or topics"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          {filtered.length ? (
            <Accordion type="single" collapsible>
              {filtered.map((q) => (
                <AccordionItem key={q.id} value={q.id}>
                  <AccordionTrigger className="text-left text-sm">
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 pr-3 sm:flex-row sm:items-center sm:gap-3">
                      <span className="min-w-0">{q.question}</span>
                      <span className="flex shrink-0 gap-1.5 sm:ml-auto">
                        <Badge variant="secondary">{q.topic}</Badge>
                        <Badge variant="outline">{q.difficulty}</Badge>
                      </span>
                    </span>
                  </AccordionTrigger>
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
              ))}
            </Accordion>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">No questions match your search.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
