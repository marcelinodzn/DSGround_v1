-- Create typography tables

-- Type styles table
CREATE TABLE type_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scale_step TEXT NOT NULL,
  font_weight INTEGER NOT NULL,
  line_height NUMERIC NOT NULL,
  letter_spacing NUMERIC NOT NULL,
  optical_size NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Typography settings table
CREATE TABLE typography_settings (
  platform_id UUID PRIMARY KEY REFERENCES platforms(id) ON DELETE CASCADE,
  base_size NUMERIC NOT NULL,
  ratio NUMERIC NOT NULL,
  steps_up INTEGER NOT NULL,
  steps_down INTEGER NOT NULL,
  viewing_distance NUMERIC,
  visual_acuity NUMERIC,
  mean_length_ratio NUMERIC,
  text_type TEXT,
  lighting TEXT,
  ppi NUMERIC
);

-- Create indexes
CREATE INDEX idx_type_styles_platform ON type_styles(platform_id);
