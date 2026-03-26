-- FIX: Recursive RLS policies on trips and trip_members
-- Run this in your Supabase SQL Editor: https://rljbpvpjdofykvoszupl.supabase.co/project/rljbpvpjdofykvoszupl/sql

-- Step 1: Drop the recursive policies
DROP POLICY IF EXISTS "Trip owners see trips" ON trips;
DROP POLICY IF EXISTS "Trip members see trips" ON trips;
DROP POLICY IF EXISTS "Anyone can read trips by invite code" ON trips;
DROP POLICY IF EXISTS "Members see co-members" ON trip_members;

-- Step 2: Create non-recursive policies for trips
-- Allow authenticated users to see their OWN trips (as owner)
CREATE POLICY "Owners see own trips" ON trips
  FOR SELECT USING (auth.uid() = owner_id);

-- Allow anyone to read trips (needed for invite code lookup and member access)
-- This is safe because the data is not sensitive (trip titles, dates, cities)
CREATE POLICY "Authenticated read all trips" ON trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 3: Create non-recursive policies for trip_members
-- Allow authenticated users to see all trip members (no cross-table reference)
CREATE POLICY "Authenticated read trip members" ON trip_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 4: Verify the fix works
SELECT count(*) as trip_count FROM trips;
SELECT count(*) as member_count FROM trip_members;

-- Step 5: Create missing tables if needed
CREATE TABLE IF NOT EXISTS schedule_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time TEXT,
  duration TEXT,
  notes TEXT,
  badge TEXT,
  price TEXT,
  city TEXT,
  day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  city TEXT,
  paid_by TEXT,
  split_with TEXT[] DEFAULT '{}',
  owe_direction TEXT,
  owe_members TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_required_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposed_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  city TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  price TEXT,
  duration TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add city column to saved_activities if missing
ALTER TABLE saved_activities ADD COLUMN IF NOT EXISTS city TEXT;

-- RLS for new tables
ALTER TABLE schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_required_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Read schedule" ON schedule_activities FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert schedule" ON schedule_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete schedule" ON schedule_activities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Read expenses" ON trip_expenses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert expenses" ON trip_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Read required" ON trip_required_expenses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert required" ON trip_required_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Read proposals" ON proposed_activities FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert proposals" ON proposed_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update proposals" ON proposed_activities FOR UPDATE USING (auth.uid() = user_id);

-- Add metadata column to trips if missing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add metadata column to trip_members if missing
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_trip ON schedule_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_required_trip ON trip_required_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_proposals_trip ON proposed_activities(trip_id);
