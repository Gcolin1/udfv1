-- Create instructor_stats table for badge system
CREATE TABLE IF NOT EXISTS instructor_stats (
  instructor_id uuid PRIMARY KEY REFERENCES instructors(id) ON DELETE CASCADE,
  classes integer DEFAULT 0 NOT NULL,
  students integer DEFAULT 0 NOT NULL,
  matches integer DEFAULT 0 NOT NULL,
  events integer DEFAULT 0 NOT NULL,
  leaders integer DEFAULT 0 NOT NULL,
  totalProfit numeric DEFAULT 0 NOT NULL,
  packagesSold integer DEFAULT 0 NOT NULL,
  engagement integer DEFAULT 0 NOT NULL,
  pioneerRank integer DEFAULT 0 NOT NULL,
  top10Classes integer DEFAULT 0 NOT NULL,
  top5Classes integer DEFAULT 0 NOT NULL,
  top3Classes integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policy
ALTER TABLE instructor_stats ENABLE ROW LEVEL SECURITY;

-- Policy for instructors to read their own stats
CREATE POLICY "Instructors can view own stats" ON instructor_stats
  FOR SELECT USING (auth.uid()::text = instructor_id::text);

-- Policy for instructors to update their own stats
CREATE POLICY "Instructors can update own stats" ON instructor_stats
  FOR ALL USING (auth.uid()::text = instructor_id::text);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_instructor_stats_instructor_id ON instructor_stats(instructor_id);