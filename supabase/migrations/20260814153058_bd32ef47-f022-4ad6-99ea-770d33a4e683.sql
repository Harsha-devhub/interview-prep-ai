ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS frequently_asked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companies text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE public.user_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  bookmarked boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_questions TO authenticated;
GRANT ALL ON public.user_questions TO service_role;

ALTER TABLE public.user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own question marks" ON public.user_questions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_questions_updated_at
  BEFORE UPDATE ON public.user_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.questions SET frequently_asked = true
  WHERE difficulty IN ('easy','medium') AND category IN ('technical','hr');

UPDATE public.questions SET companies = ARRAY['TCS','Infosys','Wipro']
  WHERE topic IN ('SQL','DBMS','Operating Systems');
UPDATE public.questions SET companies = ARRAY['Amazon','Microsoft','Google']
  WHERE topic IN ('DSA','Algorithms','Data Structures');
UPDATE public.questions SET companies = ARRAY['Accenture','Cognizant','Capgemini']
  WHERE category = 'hr';