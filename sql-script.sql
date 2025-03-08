-- Add lineHeightUnit and textTransform columns to the type_styles table
ALTER TABLE type_styles 
ADD COLUMN IF NOT EXISTS line_height_unit VARCHAR(10) DEFAULT 'percent' CHECK (line_height_unit IN ('multiplier', 'percent')),
ADD COLUMN IF NOT EXISTS text_transform VARCHAR(20) DEFAULT 'none' CHECK (text_transform IN ('none', 'uppercase', 'lowercase', 'capitalize'));

-- Update existing records to use the default values
UPDATE type_styles 
SET line_height_unit = 'percent', 
    text_transform = 'none' 
WHERE line_height_unit IS NULL OR text_transform IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN type_styles.line_height_unit IS 'Unit for line height: multiplier (e.g., 1.5×) or percent (e.g., 150%)';
COMMENT ON COLUMN type_styles.text_transform IS 'Text transformation: none, uppercase, lowercase, or capitalize (title case)'; 