-- SQL script to check the schema of the tasks table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'tasks'
ORDER BY 
  ordinal_position;
