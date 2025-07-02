/*
  # Create influencers table

  1. New Tables
    - `influencers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `udf_id` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `influencers` table
    - Add policy for authenticated users to read influencers
*/

CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  udf_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_influencers_udf_id ON influencers(udf_id);

-- Enable RLS
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to influencers"
  ON influencers
  FOR SELECT
  TO authenticated
  USING (true);