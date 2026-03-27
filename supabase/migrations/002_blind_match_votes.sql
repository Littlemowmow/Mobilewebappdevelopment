-- Blind Match votes table for persisting user votes across sessions
CREATE TABLE IF NOT EXISTS blind_match_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  activity_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, activity_id, user_id)
);

ALTER TABLE blind_match_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own votes" ON blind_match_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own votes" ON blind_match_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own votes" ON blind_match_votes FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_votes_trip_user ON blind_match_votes(trip_id, user_id);
