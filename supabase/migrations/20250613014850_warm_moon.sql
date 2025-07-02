/*
  # Create classes table

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `code` (text, unique, not null)
      - `description` (text)
      - `instructor_id` (uuid, foreign key)
      - `influencer_id` (uuid, foreign key)
      - `event_id` (uuid, foreign key)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `classes` table
    - Add policy for instructors to read their own classes
*/

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  instructor_id uuid REFERENCES instructors(id),
  influencer_id uuid REFERENCES influencers(id),
  event_id uuid REFERENCES events(id),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_event_id ON classes(event_id);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Instructors can read own classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT instructors.id
    FROM instructors
    WHERE auth.uid()::text = instructors.id::text
  ));