-- Table for storing design elements
CREATE TABLE IF NOT EXISTS public.design_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('image', 'shape', 'text', 'component')),
  name TEXT NOT NULL,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  properties JSONB NOT NULL DEFAULT '{}',
  assets JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS design_elements_platform_id_idx ON public.design_elements(platform_id);

-- Table for storing layer styles
CREATE TABLE IF NOT EXISTS public.layer_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS layer_styles_platform_id_idx ON public.layer_styles(platform_id);

-- Table for storing user preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, preference_type)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.design_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Storage bucket for design assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design_assets', 'Design Assets', TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies

-- Design Elements policies
CREATE POLICY "Design elements are viewable by authenticated users"
  ON public.design_elements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Design elements can be inserted by authenticated users"
  ON public.design_elements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Design elements can be updated by authenticated users"
  ON public.design_elements
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Design elements can be deleted by authenticated users"
  ON public.design_elements
  FOR DELETE
  TO authenticated
  USING (true);

-- Layer Styles policies
CREATE POLICY "Layer styles are viewable by authenticated users"
  ON public.layer_styles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Layer styles can be inserted by authenticated users"
  ON public.layer_styles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Layer styles can be updated by authenticated users"
  ON public.layer_styles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Layer styles can be deleted by authenticated users"
  ON public.layer_styles
  FOR DELETE
  TO authenticated
  USING (true);

-- User Preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage policy for design assets
CREATE POLICY "Design assets are accessible to all users"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'design_assets');

CREATE POLICY "Authenticated users can upload design assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'design_assets');

CREATE POLICY "Authenticated users can update their design assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'design_assets');

CREATE POLICY "Authenticated users can delete their design assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'design_assets');
