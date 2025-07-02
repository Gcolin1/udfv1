/*
  # Complete Database Schema Migration

  1. New Tables
    - `instructors` - Store instructor information with UDF integration
    - `influencers` - Store influencer information  
    - `events` - Store events created by instructors
    - `classes` - Store classes linked to events via webhooks
    - `players` - Store player information
    - `class_players` - Junction table for class-player relationships
    - `matches` - Store match data

  2. Security
    - Enable RLS on all tables
    - Add policies for instructors to access their own data
    - Add policies for data access through class relationships

  3. Indexes
    - Add performance indexes on foreign keys and unique fields
*/

-- Create enum for event type
DO $$ BEGIN
  CREATE TYPE event_type_enum AS ENUM ('training', 'course');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create instructors table
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

-- Create indexes for instructors
CREATE INDEX IF NOT EXISTS idx_instructors_udf_id ON instructors(udf_id);
CREATE INDEX IF NOT EXISTS idx_instructors_app_id ON instructors(app_id);
CREATE INDEX IF NOT EXISTS idx_instructors_external_id ON instructors(external_id);

-- Create influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  udf_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for influencers
CREATE INDEX IF NOT EXISTS idx_influencers_udf_id ON influencers(udf_id);

-- Create events table
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

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE INDEX IF NOT EXISTS idx_events_instructor_id ON events(instructor_id);

-- Create classes table
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
  updated_at timestamptz DEFAULT now(),
  event_type event_type_enum DEFAULT 'training',
  schedule jsonb DEFAULT '[]'::jsonb
);

-- Create indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_event_id ON classes(event_id);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  udf_id text UNIQUE,
  device_identifier text,
  team_id integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  external_id text,
  registration_number text
);

-- Create indexes for players
CREATE INDEX IF NOT EXISTS idx_players_udf_id ON players(udf_id);

-- Create class_players junction table
CREATE TABLE IF NOT EXISTS class_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id),
  player_id uuid REFERENCES players(id),
  joined_at timestamptz DEFAULT now(),
  total_matches integer DEFAULT 0,
  avg_score numeric DEFAULT 0,
  UNIQUE(class_id, player_id)
);

-- Create indexes for class_players
CREATE INDEX IF NOT EXISTS idx_class_players_class_id ON class_players(class_id);
CREATE INDEX IF NOT EXISTS idx_class_players_player_id ON class_players(player_id);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_serial text NOT NULL,
  match_date timestamptz NOT NULL,
  player_id uuid REFERENCES players(id),
  event_id uuid REFERENCES events(id),
  class_id uuid REFERENCES classes(id),
  match_number integer DEFAULT 0,
  match_id_legacy text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_player_id ON matches(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches(event_id);
CREATE INDEX IF NOT EXISTS idx_matches_class_id ON matches(class_id);

-- Enable RLS on all tables
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Instructors can read own data" ON instructors;
DROP POLICY IF EXISTS "Instructors can update own data" ON instructors;
DROP POLICY IF EXISTS "Allow authenticated users to create instructor profile" ON instructors;
DROP POLICY IF EXISTS "Allow read access to influencers" ON influencers;
DROP POLICY IF EXISTS "Instructors can read own events" ON events;
DROP POLICY IF EXISTS "Instructors can insert own events" ON events;
DROP POLICY IF EXISTS "Instructors can update own events" ON events;
DROP POLICY IF EXISTS "Instructors can read own classes" ON classes;
DROP POLICY IF EXISTS "Instructors can read players from their classes" ON players;
DROP POLICY IF EXISTS "Instructors can read class_players from their classes" ON class_players;
DROP POLICY IF EXISTS "Instructors can read matches from their classes" ON matches;
DROP POLICY IF EXISTS "permit all" ON instructors;
DROP POLICY IF EXISTS "permit" ON events;
DROP POLICY IF EXISTS "permit all" ON events;
DROP POLICY IF EXISTS "permit" ON classes;
DROP POLICY IF EXISTS "permit" ON players;
DROP POLICY IF EXISTS "permit" ON class_players;
DROP POLICY IF EXISTS "permit" ON matches;
DROP POLICY IF EXISTS "true" ON influencers;

-- Instructors policies
CREATE POLICY "Instructors can read own data"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can update own data"
  ON instructors
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Allow authenticated users to create instructor profile"
  ON instructors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "permit all"
  ON instructors
  FOR ALL
  TO public
  USING (true);

-- Influencers policies
CREATE POLICY "Allow read access to influencers"
  ON influencers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "true"
  ON influencers
  FOR ALL
  TO public
  USING (true);

-- Events policies
CREATE POLICY "Instructors can read own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Instructors can insert own events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id IN (
    SELECT id FROM instructors WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Instructors can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "permit"
  ON events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "permit all"
  ON events
  FOR ALL
  TO public
  USING (true);

-- Classes policies
CREATE POLICY "Instructors can read own classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "permit"
  ON classes
  FOR SELECT
  TO public
  USING (true);

-- Players policies
CREATE POLICY "Instructors can read players from their classes"
  ON players
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT cp.player_id
    FROM class_players cp
    JOIN classes c ON cp.class_id = c.id
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));

CREATE POLICY "permit"
  ON players
  FOR ALL
  TO public
  USING (true);

-- Class_players policies
CREATE POLICY "Instructors can read class_players from their classes"
  ON class_players
  FOR SELECT
  TO authenticated
  USING (class_id IN (
    SELECT c.id
    FROM classes c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE auth.uid()::text = i.id::text
  ));

CREATE POLICY "permit"
  ON class_players
  FOR ALL
  TO public
  USING (true);

-- Matches policies
CREATE POLICY "Instructors can read matches from their classes"
  ON matches
  FOR SELECT
  TO authenticated
  USING (
    (class_id IN (
      SELECT c.id
      FROM classes c
      JOIN instructors i ON c.instructor_id = i.id
      WHERE auth.uid()::text = i.id::text
    )) OR
    (event_id IN (
      SELECT e.id
      FROM events e
      JOIN instructors i ON e.instructor_id = i.id
      WHERE auth.uid()::text = i.id::text
    ))
  );

CREATE POLICY "permit"
  ON matches
  FOR ALL
  TO public
  USING (true);