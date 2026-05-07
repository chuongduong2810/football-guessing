-- Football Predictions Database Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo TEXT,
  away_logo TEXT,
  match_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
  final_home_score INTEGER,
  final_away_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score INTEGER NOT NULL CHECK (predicted_away_score >= 0),
  points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tournaments policies
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can insert tournaments" ON public.tournaments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update tournaments" ON public.tournaments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete tournaments" ON public.tournaments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Matches policies
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Predictions policies
CREATE POLICY "Predictions are viewable by everyone" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate prediction points when match score is updated
CREATE OR REPLACE FUNCTION public.calculate_points(
  p_predicted_home INTEGER,
  p_predicted_away INTEGER,
  p_actual_home INTEGER,
  p_actual_away INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_predicted_home = p_actual_home AND p_predicted_away = p_actual_away THEN
    RETURN 3;
  ELSIF (
    (p_predicted_home > p_predicted_away AND p_actual_home > p_actual_away) OR
    (p_predicted_home < p_predicted_away AND p_actual_home < p_actual_away) OR
    (p_predicted_home = p_predicted_away AND p_actual_home = p_actual_away)
  ) THEN
    RETURN 1;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_prediction_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.final_home_score IS NOT NULL AND NEW.final_away_score IS NOT NULL THEN
    UPDATE public.predictions
    SET points = public.calculate_points(
      predicted_home_score,
      predicted_away_score,
      NEW.final_home_score,
      NEW.final_away_score
    )
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_match_score_update
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.update_prediction_points();

-- Seed data
INSERT INTO public.tournaments (name, logo_url) VALUES
('Premier League', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg'),
('UEFA Champions League', 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg'),
('La Liga', 'https://upload.wikimedia.org/wikipedia/commons/1/13/LaLiga.svg');

INSERT INTO public.matches (tournament_id, home_team, away_team, home_logo, away_logo, match_time, status) VALUES
((SELECT id FROM public.tournaments WHERE name = 'Premier League'), 'Manchester United', 'Liverpool', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', '2026-05-15 20:00:00+00', 'upcoming'),
((SELECT id FROM public.tournaments WHERE name = 'Premier League'), 'Arsenal', 'Chelsea', 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg', '2026-05-16 17:30:00+00', 'upcoming'),
((SELECT id FROM public.tournaments WHERE name = 'UEFA Champions League'), 'Barcelona', 'Bayern Munich', 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', '2026-05-20 19:00:00+00', 'upcoming'),
((SELECT id FROM public.tournaments WHERE name = 'La Liga'), 'Atletico Madrid', 'Sevilla', 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg', '2026-05-10 14:00:00+00', 'upcoming');
