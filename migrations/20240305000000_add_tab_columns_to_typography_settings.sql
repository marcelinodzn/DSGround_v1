-- Add view_tab and analysis_tab columns to typography_settings table
ALTER TABLE typography_settings
ADD COLUMN IF NOT EXISTS view_tab TEXT,
ADD COLUMN IF NOT EXISTS analysis_tab TEXT,
ADD COLUMN IF NOT EXISTS scale_method TEXT,
ADD COLUMN IF NOT EXISTS scale_config JSONB,
ADD COLUMN IF NOT EXISTS distance_scale JSONB,
ADD COLUMN IF NOT EXISTS ai_settings JSONB;

-- Drop old columns that are no longer used
ALTER TABLE typography_settings
DROP COLUMN IF EXISTS base_size,
DROP COLUMN IF EXISTS ratio,
DROP COLUMN IF EXISTS steps_up,
DROP COLUMN IF EXISTS steps_down,
DROP COLUMN IF EXISTS viewing_distance,
DROP COLUMN IF EXISTS visual_acuity,
DROP COLUMN IF EXISTS mean_length_ratio,
DROP COLUMN IF EXISTS text_type,
DROP COLUMN IF EXISTS lighting,
DROP COLUMN IF EXISTS ppi;
