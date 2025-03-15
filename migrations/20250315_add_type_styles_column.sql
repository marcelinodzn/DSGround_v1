-- Add type_styles column to typography_settings table
ALTER TABLE typography_settings ADD COLUMN IF NOT EXISTS type_styles JSONB;

-- Update existing rows to have an empty array for type_styles if null
UPDATE typography_settings SET type_styles = '[]'::jsonb WHERE type_styles IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN typography_settings.type_styles IS 'JSON array of typography style definitions';
