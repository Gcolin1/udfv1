/*
  # Add INSERT policy for instructors table

  1. Security
    - Add RLS policy to allow authenticated users to insert their own instructor record
    - This enables the AuthContext to create instructor records when users sign up
    - Policy ensures users can only insert records with their own auth.uid() as the ID

  2. Problem Resolution
    - Fixes infinite loading issue caused by failed instructor record creation
    - Allows loadUserData function to successfully create instructor records
    - Maintains security by restricting inserts to authenticated users' own records
*/

-- Add INSERT policy for instructors table
CREATE POLICY "Allow authenticated users to insert their own instructor record"
  ON instructors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy to allow users to insert records during signup process
-- This is needed because during signup, the user might not have an instructor record yet
CREATE POLICY "Allow authenticated users to create instructor profile"
  ON instructors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);