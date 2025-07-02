/*
  # Add purpose enum and update tables

  1. New Enums
    - `purpose_enum` - For player and team purposes (lucro, satisfacao, bonus)

  2. Table Updates
    - Add `purpose` column to `players` table
    - Add `device_identifier` column to `players` table (fixing typo)
    - Create `teams` table with group purpose functionality
    - Create `match_results` table for storing match performance data

  3. Security
    - Add appropriate RLS policies for new tables
*/

-- Create purpose enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE purpose_enum AS ENUM ('lucro', 'satisfacao', 'bonus');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add purpose column to players table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE players ADD COLUMN purpose purpose_enum;
  END IF;
END $$;

-- Fix device_identifier column name if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'device_indentifier'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'device_identifier'
  ) THEN
    ALTER TABLE players RENAME COLUMN device_indentifier TO device_identifier;
  END IF;
END $$;

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id),
  name text,
  group_purpose purpose_enum,
  created_by uuid REFERENCES instructors(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_class_id ON teams(class_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- Create match_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS match_results (
  player_id uuid NOT NULL REFERENCES players(id),
  class_id uuid NOT NULL REFERENCES classes(id),
  match_number integer NOT NULL,
  lucro numeric,
  satisfacao numeric,
  bonus numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (player_id, class_id, match_number)
);

-- Create indexes for match_results
CREATE INDEX IF NOT EXISTS idx_match_results_player_id ON match_results(player_id);
CREATE INDEX IF NOT EXISTS idx_match_results_class_id ON match_results(class_id);

-- Enable RLS on new tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Instructors can read their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (class_id IN (
    SELECT c.id
    FROM classes c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));

CREATE POLICY "Instructors can insert their teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    class_id IN (
      SELECT c.id
      FROM classes c
      JOIN instructors i ON c.instructor_id = i.id
      WHERE auth.uid()::text = i.id::text
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Instructors can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (class_id IN (
    SELECT c.id
    FROM classes c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));

-- Match results policies
CREATE POLICY "Instructors can read match results for their classes"
  ON match_results
  FOR SELECT
  TO authenticated
  USING (class_id IN (
    SELECT c.id
    FROM classes c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));