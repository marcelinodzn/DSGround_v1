-- Grant permissions to access information schema
GRANT USAGE ON SCHEMA information_schema TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO anon, authenticated;

-- Alternative approach: Create a function to list tables
CREATE OR REPLACE FUNCTION public.list_tables()
RETURNS TABLE (table_name text) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql; 