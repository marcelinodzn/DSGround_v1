-- Table for storing color palettes
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_color JSONB NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_core BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS color_palettes_brand_id_idx ON public.color_palettes(brand_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for color_palettes
CREATE POLICY "Color palettes are viewable by authenticated users"
  ON public.color_palettes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Color palettes can be inserted by authenticated users"
  ON public.color_palettes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Color palettes can be updated by authenticated users"
  ON public.color_palettes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Color palettes can be deleted by authenticated users"
  ON public.color_palettes
  FOR DELETE
  TO authenticated
  USING (true);
