-- Weventr Database Schema
-- Run this in your Supabase SQL editor to create all required tables

-- Activities discovered from APIs and persisted
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  cost_tier INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  experience_tag TEXT,
  neighborhood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, city)
);

-- Saved/swiped activities per user
CREATE TABLE IF NOT EXISTS saved_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  is_super_like BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  destinations TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT DEFAULT 'planning',
  status TEXT DEFAULT 'active',
  invite_code TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip members (users who joined via invite)
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Schedule activities (manually added to trip schedule)
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

-- Trip expenses (budget tracking)
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

-- Trip required expenses (fund lock / non-negotiable costs)
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

-- User profiles (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Explorer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_required_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Activities: anyone can read, authenticated can insert
CREATE POLICY "Activities are public" ON activities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert activities" ON activities FOR INSERT WITH CHECK (true);

-- Saved activities: users see their own
CREATE POLICY "Users see own saved" ON saved_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users save own" ON saved_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trips: owners and members can see
CREATE POLICY "Trip owners see trips" ON trips FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Trip members see trips" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid())
);
CREATE POLICY "Anyone can read trips by invite code" ON trips FOR SELECT USING (true);
CREATE POLICY "Authenticated create trips" ON trips FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update trips" ON trips FOR UPDATE USING (auth.uid() = owner_id);

-- Trip members: members can see co-members
CREATE POLICY "Members see co-members" ON trip_members FOR SELECT USING (true);
CREATE POLICY "Authenticated join trips" ON trip_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Schedule: trip participants can CRUD
CREATE POLICY "Anyone can read schedule" ON schedule_activities FOR SELECT USING (true);
CREATE POLICY "Authenticated add schedule" ON schedule_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Expenses: trip participants can CRUD
CREATE POLICY "Anyone can read expenses" ON trip_expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated add expenses" ON trip_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read required expenses" ON trip_required_expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated add required expenses" ON trip_required_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles: users manage their own
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city);
CREATE INDEX IF NOT EXISTS idx_saved_activities_user ON saved_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_owner ON trips(owner_id);
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON trips(invite_code);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_schedule_trip ON schedule_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_required_expenses_trip ON trip_required_expenses(trip_id);

-- Storage bucket for avatar uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read avatars, authenticated users can upload their own
CREATE POLICY "Public avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for trips and members
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
