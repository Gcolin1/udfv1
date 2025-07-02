/*
  # Create instructors table

  1. New Tables
    - `instructors`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `udf_id` (text, unique)
      - `app_id` (text, unique)
      - `external_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `instructors` table
    - Add policy for instructors to read their own data
    - Add policy for instructors to update their own data
*/

CREATE TABLE IF NOT EXISTS instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  udf_id text UNIQUE,
  app_id text UNIQUE,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_udf_id ON instructors(udf_id);
CREATE INDEX IF NOT EXISTS idx_instructors_app_id ON instructors(app_id);
CREATE INDEX IF NOT EXISTS idx_instructors_external_id ON instructors(external_id);

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Instructors can read own data"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Instructors can update own data"
  ON instructors
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);