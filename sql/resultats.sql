-- Table résultats unifiée pour tous les tests club
CREATE TABLE IF NOT EXISTS resultats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('PMP','MPA','CMP','PSYCHO')),
  score_global INTEGER,
  profile_code TEXT,
  profile_label TEXT,
  scores JSONB,
  dimensions JSONB,
  forces JSONB,
  leviers JSONB,
  vigilances JSONB,
  description TEXT,
  neurochimie JSONB,
  itca JSONB,
  sport JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resultats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acces authentifie" ON resultats FOR ALL TO authenticated USING (true) WITH CHECK (true);
