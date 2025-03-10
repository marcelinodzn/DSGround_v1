-- Create platforms table if it doesn't exist
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  units JSONB NOT NULL DEFAULT '{"typography": "px", "spacing": "px", "dimensions": "px", "borderWidth": "px", "borderRadius": "px"}',
  layout JSONB NOT NULL DEFAULT '{"gridColumns": 12, "gridGutter": 16, "containerPadding": 16}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create typography_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS typography_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  scale_method TEXT NOT NULL DEFAULT 'modular',
  scale_config JSONB NOT NULL DEFAULT '{"baseSize": 16, "ratio": 1.2, "stepsUp": 3, "stepsDown": 2}',
  distance_scale JSONB DEFAULT '{"viewingDistance": 400, "visualAcuity": 1, "meanLengthRatio": 5, "textType": "continuous", "lighting": "good", "ppi": 96}',
  ai_settings JSONB,
  view_tab TEXT,
  analysis_tab TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create type_styles table if it doesn't exist
CREATE TABLE IF NOT EXISTS type_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scale_step TEXT,
  font_family TEXT,
  font_weight INTEGER,
  line_height NUMERIC,
  line_height_unit TEXT,
  letter_spacing NUMERIC,
  optical_size NUMERIC,
  font_size NUMERIC,
  text_transform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_platforms_modtime') THEN
    CREATE TRIGGER update_platforms_modtime
    BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_typography_settings_modtime') THEN
    CREATE TRIGGER update_typography_settings_modtime
    BEFORE UPDATE ON typography_settings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_type_styles_modtime') THEN
    CREATE TRIGGER update_type_styles_modtime
    BEFORE UPDATE ON type_styles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Set up Row Level Security (RLS) policies
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE typography_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_styles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY platforms_policy ON platforms
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY typography_settings_policy ON typography_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY type_styles_policy ON type_styles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for anonymous users (if needed)
CREATE POLICY platforms_anon_policy ON platforms
  FOR SELECT TO anon
  USING (true);

CREATE POLICY typography_settings_anon_policy ON typography_settings
  FOR SELECT TO anon
  USING (true);

CREATE POLICY type_styles_anon_policy ON type_styles
  FOR SELECT TO anon
  USING (true); 