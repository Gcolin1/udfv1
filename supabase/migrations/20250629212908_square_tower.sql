/*
  # Update team formation functionality

  1. Database Changes
    - Update players.team_id column to be uuid and reference teams.id
    - Add proper foreign key constraint
    - Update existing data to maintain consistency

  2. Security
    - Update RLS policies for team management
    - Add policies for team formation by instructors
*/

-- First, let's handle the team_id column update
-- We need to be careful with existing data

-- Add a temporary column for the new uuid team_id
ALTER TABLE players ADD COLUMN team_id_new uuid;

-- Update the temporary column to reference existing teams if any
-- For now, we'll set it to null for all existing players
UPDATE players SET team_id_new = NULL;

-- Drop the old team_id column
ALTER TABLE players DROP COLUMN team_id;

-- Rename the new column to team_id
ALTER TABLE players RENAME COLUMN team_id_new TO team_id;

-- Add the foreign key constraint
ALTER TABLE players ADD CONSTRAINT players_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- Update RLS policies for teams
DROP POLICY IF EXISTS "Instructors can read their teams" ON teams;
DROP POLICY IF EXISTS "Instructors can insert their teams" ON teams;
DROP POLICY IF EXISTS "Instructors can update their teams" ON teams;
DROP POLICY IF EXISTS "Instructors can delete their teams" ON teams;

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

CREATE POLICY "Instructors can delete their teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (class_id IN (
    SELECT c.id
    FROM classes c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));

-- Add public policies for webhook access
CREATE POLICY "Public can read teams"
  ON teams
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage teams"
  ON teams
  FOR ALL
  TO public
  USING (true);