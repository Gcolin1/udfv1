/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique, not null)
      - `description` (text)
      - `subject` (text)
      - `difficulty` (text, default 'medium')
      - `time_limit` (integer, default 30)
      - `max_players` (integer, default 50)
      - `instructions` (text)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `instructor_id` (uuid, foreign key)
      - `event_id_legacy` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `events` table
    - Add policies for instructors to manage their own events
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  code text UNIQUE NOT NULL,
  description text,
  subject text,
  difficulty text DEFAULT 'medium',
  time_limit integer DEFAULT 30,
  max_players integer DEFAULT 50,
  instructions text,
  start_date timestamptz,
  end_date timestamptz,
  instructor_id uuid REFERENCES instructors(id),
  event_id_legacy text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE INDEX IF NOT EXISTS idx_events_instructor_id ON events(instructor_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Instructors can read own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT instructors.id
    FROM instructors
    WHERE auth.uid()::text = instructors.id::text
  ));

CREATE POLICY "Instructors can insert own events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id IN (
    SELECT instructors.id
    FROM instructors
    WHERE auth.uid()::text = instructors.id::text
  ));

CREATE POLICY "Instructors can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (instructor_id IN (
    SELECT instructors.id
    FROM instructors
    WHERE auth.uid()::text = instructors.id::text
  ));