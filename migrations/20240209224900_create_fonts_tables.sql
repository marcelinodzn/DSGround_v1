-- Create fonts table
CREATE TABLE fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family TEXT NOT NULL,
  weight INTEGER NOT NULL,
  style TEXT NOT NULL,
  format TEXT NOT NULL,
  is_variable BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  tags TEXT[],
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create font_families table to group fonts
CREATE TABLE font_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create font_versions table for versioning
CREATE TABLE font_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  font_id UUID REFERENCES fonts(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_fonts_family ON fonts(family);
CREATE INDEX idx_fonts_category ON fonts(category);
CREATE INDEX idx_font_families_name ON font_families(name);
CREATE INDEX idx_font_versions_font_id ON font_versions(font_id);
