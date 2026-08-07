
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  target_role TEXT,
  experience_level TEXT NOT NULL DEFAULT 'fresher',
  skills TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  role TEXT,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question TEXT NOT NULL,
  model_answer TEXT,
  options JSONB,
  correct_option INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'technical',
  topic TEXT,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_attempts TO authenticated;
GRANT ALL ON public.practice_attempts TO service_role;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.practice_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  score INT NOT NULL,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_results TO authenticated;
GRANT ALL ON public.assessment_results TO service_role;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own results" ON public.assessment_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'mixed',
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score INT,
  feedback JSONB,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_interviews TO authenticated;
GRANT ALL ON public.mock_interviews TO service_role;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interviews" ON public.mock_interviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.questions (category, role, topic, difficulty, question, model_answer) VALUES
('technical','Software Engineer','Data Structures','easy','What is the difference between an array and a linked list?','Arrays store elements in contiguous memory with O(1) random access but costly insertions/deletions. Linked lists use nodes with pointers, giving O(1) insertion/deletion at a known position but O(n) access.'),
('technical','Software Engineer','Data Structures','medium','Explain how a hash table handles collisions.','Collisions are handled with separate chaining (buckets of linked lists) or open addressing (linear/quadratic probing, double hashing). Load factor and resizing keep average operations near O(1).'),
('technical','Software Engineer','Algorithms','medium','Describe the time and space complexity of merge sort and why it is stable.','Merge sort is O(n log n) time and O(n) space. It is stable because equal elements retain relative order when merging picks from the left subarray first.'),
('technical','Software Engineer','DBMS','easy','What is normalization and why is it used?','Normalization organizes tables to reduce redundancy and anomalies, progressing through 1NF, 2NF, 3NF and BCNF by removing partial and transitive dependencies.'),
('technical','Software Engineer','Operating Systems','medium','What is a deadlock and what are the four Coffman conditions?','Deadlock is when processes wait on each other forever. Conditions: mutual exclusion, hold and wait, no preemption, circular wait. Breaking any one prevents deadlock.'),
('technical','Frontend Developer','JavaScript','easy','Explain closures in JavaScript with an example use case.','A closure is a function that retains access to its lexical scope after the outer function returns. Used for data privacy, function factories and memoization.'),
('technical','Frontend Developer','React','medium','What is the virtual DOM and how does reconciliation work?','React keeps a lightweight virtual tree, diffs new against old using keys and element type heuristics, then applies the minimal set of real DOM mutations.'),
('technical','Frontend Developer','React','medium','When would you use useMemo versus useCallback?','useMemo caches a computed value, useCallback caches a function identity. Both prevent unnecessary recomputation or re-renders of memoized children.'),
('technical','Data Analyst','SQL','easy','What is the difference between WHERE and HAVING?','WHERE filters rows before aggregation; HAVING filters groups after aggregation.'),
('technical','Data Analyst','SQL','medium','Explain the difference between INNER JOIN, LEFT JOIN and FULL OUTER JOIN.','INNER returns matching rows only, LEFT keeps all left rows with NULLs for unmatched right rows, FULL OUTER keeps unmatched rows from both sides.'),
('technical','Backend Developer','System Design','hard','How would you design a URL shortener that handles 10k requests per second?','Discuss base62 ID generation, key-value storage, caching hot links, read replicas, CDN, rate limiting, and analytics via an async queue.'),
('technical','Backend Developer','Networking','medium','What happens when you type a URL into a browser and press enter?','DNS resolution, TCP handshake, TLS negotiation, HTTP request, server processing, response, browser parsing, rendering and subresource fetching.'),
('hr',NULL,'Introduction','easy','Tell me about yourself.','Give a 60-90 second pitch: current status, relevant projects/skills, one standout achievement, and why this role.'),
('hr',NULL,'Strengths & Weaknesses','easy','What is your greatest weakness?','Pick a genuine, non-critical weakness and show concrete steps you are taking to improve it, with evidence of progress.'),
('hr',NULL,'Motivation','easy','Why do you want to work at our company?','Reference specific products, engineering culture or values, and tie them to your own goals and skills.'),
('hr',NULL,'Behavioural','medium','Describe a time you handled conflict in a team.','Use STAR: situation, task, action, result. Emphasise listening, data-driven resolution and the outcome for the team.'),
('hr',NULL,'Behavioural','medium','Tell me about a time you failed and what you learned.','Own the failure honestly, explain the root cause, the corrective action, and the lasting process change you made.'),
('hr',NULL,'Career Goals','easy','Where do you see yourself in five years?','Show ambition grounded in the role: deepening technical mastery, mentoring, and taking ownership of larger systems.');

INSERT INTO public.questions (category, role, topic, difficulty, question, options, correct_option, model_answer) VALUES
('mcq',NULL,'Data Structures','easy','What is the average time complexity of searching in a balanced binary search tree?','["O(1)","O(log n)","O(n)","O(n log n)"]'::jsonb,1,'Balanced BSTs keep height at log n.'),
('mcq',NULL,'Data Structures','easy','Which data structure uses FIFO ordering?','["Stack","Queue","Tree","Graph"]'::jsonb,1,'Queues are first in, first out.'),
('mcq',NULL,'Algorithms','medium','Which sorting algorithm has the worst-case time complexity of O(n^2)?','["Merge sort","Heap sort","Quick sort","Radix sort"]'::jsonb,2,'Quick sort degrades to O(n^2) on bad pivots.'),
('mcq',NULL,'DBMS','easy','Which SQL clause removes duplicate rows from a result set?','["UNIQUE","DISTINCT","FILTER","GROUP"]'::jsonb,1,'DISTINCT removes duplicates.'),
('mcq',NULL,'DBMS','medium','A relation is in 3NF if it is in 2NF and has no...','["Partial dependency","Transitive dependency","Multivalued dependency","Join dependency"]'::jsonb,1,'3NF eliminates transitive dependencies.'),
('mcq',NULL,'Operating Systems','medium','Which scheduling algorithm can cause starvation?','["Round robin","First come first served","Priority scheduling","Multilevel round robin"]'::jsonb,2,'Low-priority processes may never run.'),
('mcq',NULL,'JavaScript','easy','What does the typeof null return in JavaScript?','["null","undefined","object","number"]'::jsonb,2,'A long-standing language quirk.'),
('mcq',NULL,'JavaScript','medium','Which method creates a new array with elements that pass a test?','["map","filter","reduce","forEach"]'::jsonb,1,'filter returns matching elements.'),
('mcq',NULL,'React','medium','Which hook is used to perform side effects in a function component?','["useState","useEffect","useMemo","useRef"]'::jsonb,1,'useEffect runs side effects.'),
('mcq',NULL,'Networking','medium','Which protocol operates at the transport layer and is connectionless?','["TCP","UDP","HTTP","ARP"]'::jsonb,1,'UDP is connectionless.'),
('mcq',NULL,'OOP','easy','Which OOP principle hides internal state behind a public interface?','["Inheritance","Polymorphism","Encapsulation","Abstraction"]'::jsonb,2,'Encapsulation hides internal state.'),
('mcq',NULL,'SQL','medium','Which join returns all rows from the left table regardless of matches?','["INNER JOIN","LEFT JOIN","RIGHT JOIN","CROSS JOIN"]'::jsonb,1,'LEFT JOIN keeps all left rows.');
