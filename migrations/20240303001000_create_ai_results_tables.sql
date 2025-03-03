-- Table for storing AI analysis results
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID REFERENCES public.platforms(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('image', 'platform', 'typography', 'color', 'general')),
  prompt TEXT NOT NULL,
  result JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster querying
CREATE INDEX IF NOT EXISTS ai_analysis_results_platform_id_idx ON public.ai_analysis_results(platform_id);
CREATE INDEX IF NOT EXISTS ai_analysis_results_brand_id_idx ON public.ai_analysis_results(brand_id);
CREATE INDEX IF NOT EXISTS ai_analysis_results_analysis_type_idx ON public.ai_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS ai_analysis_results_created_at_idx ON public.ai_analysis_results(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies for AI analysis results
CREATE POLICY "AI analysis results are viewable by authenticated users"
  ON public.ai_analysis_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI analysis results can be inserted by authenticated users"
  ON public.ai_analysis_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "AI analysis results can be updated by authenticated users"
  ON public.ai_analysis_results
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "AI analysis results can be deleted by authenticated users"
  ON public.ai_analysis_results
  FOR DELETE
  TO authenticated
  USING (true);
