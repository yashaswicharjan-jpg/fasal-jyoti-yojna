
-- GOVERNMENT SCHEMES MASTER TABLE
CREATE TABLE public.govt_schemes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_code text UNIQUE NOT NULL,
  scheme_name text NOT NULL,
  scheme_name_hindi text NOT NULL,
  scheme_name_marathi text NOT NULL,
  ministry text NOT NULL,
  scheme_type text CHECK (scheme_type IN ('subsidy','insurance','loan','training','market','input','pension','other')),
  target_beneficiary text[],
  eligible_states text[],
  max_benefit_amount numeric(12,2),
  benefit_description text,
  benefit_description_hindi text,
  benefit_description_marathi text,
  eligibility_criteria jsonb,
  required_documents text[],
  application_method text CHECK (application_method IN ('online','offline','csc','bank','mobile_app','both')),
  application_portal_url text,
  application_form_url text,
  helpline_number text,
  application_start_date date,
  application_deadline date,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  is_active boolean DEFAULT true,
  tags text[],
  icon_emoji text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FARMER SCHEME APPLICATIONS TABLE
CREATE TABLE public.scheme_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheme_id uuid REFERENCES public.govt_schemes(id) ON DELETE CASCADE NOT NULL,
  application_reference_number text,
  application_date date DEFAULT current_date,
  status text CHECK (status IN ('draft','submitted','under_review','approved','rejected','disbursed','expired')) DEFAULT 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  disbursed_at timestamptz,
  rejection_reason text,
  benefit_amount_received numeric(12,2),
  notes text,
  documents_uploaded text[],
  next_action text,
  next_action_due_date date,
  reminder_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, scheme_id)
);

-- ROW LEVEL SECURITY
ALTER TABLE public.govt_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active schemes" ON public.govt_schemes FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own applications" ON public.scheme_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.scheme_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.scheme_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.scheme_applications FOR DELETE USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_govt_schemes_type ON public.govt_schemes(scheme_type);
CREATE INDEX idx_scheme_applications_user ON public.scheme_applications(user_id, created_at DESC);
