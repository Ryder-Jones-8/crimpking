-- TCA Climb Rating Normalization App - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GYMS TABLE
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLS TABLE (Zones/Sectors within a Gym)
CREATE TABLE IF NOT EXISTS public.walls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIMBS TABLE
CREATE TABLE IF NOT EXISTS public.climbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  wall_id UUID NOT NULL REFERENCES public.walls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'bouldering', -- 'bouldering', 'sport', 'trad'
  gym_grade TEXT NOT NULL, -- e.g., 'V4', 'V6', '5.11b'
  setter_notes TEXT,
  active_from DATE DEFAULT CURRENT_DATE,
  active_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  qr_code_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'climber' CHECK (role IN ('climber', 'setter', 'owner')),
  home_gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new Supabase Auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'climber'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  climb_id UUID NOT NULL REFERENCES public.climbs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comparative_rating TEXT NOT NULL CHECK (comparative_rating IN ('easier', 'as_graded', 'harder')),
  quality_stars INTEGER NOT NULL CHECK (quality_stars BETWEEN 1 AND 5),
  comment TEXT,
  photo_url TEXT,
  is_spam BOOLEAN DEFAULT FALSE,
  spam_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Gyms, Walls, Climbs are publicly readable
CREATE POLICY "Public gyms are viewable by everyone" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Public walls are viewable by everyone" ON public.walls FOR SELECT USING (true);
CREATE POLICY "Public climbs are viewable by everyone" ON public.climbs FOR SELECT USING (true);
CREATE POLICY "Public ratings are viewable by everyone" ON public.ratings FOR SELECT USING (true);

-- Authenticated/Public write policies
CREATE POLICY "Anyone can submit a rating" ON public.ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Setters and owners can create climbs" ON public.climbs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('setter', 'owner'))
);
CREATE POLICY "Setters and owners can create walls" ON public.walls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('setter', 'owner'))
);
CREATE POLICY "Owners can create gyms" ON public.gyms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Profiles management
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Sample Data Insertion Function
CREATE OR REPLACE FUNCTION seed_sample_climbing_data()
RETURNS void AS $$
DECLARE
  gym1_id UUID := '11111111-1111-1111-1111-111111111111';
  gym2_id UUID := '22222222-2222-2222-2222-222222222222';
  wall1_id UUID := 'a1111111-1111-1111-1111-111111111111';
  wall2_id UUID := 'a2222222-2222-2222-2222-222222222222';
  wall3_id UUID := 'a3333333-3333-3333-3333-333333333333';
  climb1_id UUID := 'c1111111-1111-1111-1111-111111111111';
  climb2_id UUID := 'c2222222-2222-2222-2222-222222222222';
  climb3_id UUID := 'c3333333-3333-3333-3333-333333333333';
  climb4_id UUID := 'c4444444-4444-4444-4444-444444444444';
BEGIN
  -- Gyms
  INSERT INTO public.gyms (id, name, location) VALUES
    (gym1_id, 'Summit Peak Climbing Gym', 'Downtown Tech District')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.gyms (id, name, location) VALUES
    (gym2_id, 'Gravity Lab Bouldering', 'Westside Warehouse District')
  ON CONFLICT (id) DO NOTHING;

  -- Walls
  INSERT INTO public.walls (id, gym_id, name, description) VALUES
    (wall1_id, gym1_id, 'The Cave', '45 degree overhang section with heavy roof problems'),
    (wall2_id, gym1_id, 'Slab Paradise', 'Low angle balance and technical crimps'),
    (wall3_id, gym2_id, 'The Island', '360 degree feature wall in the center floor')
  ON CONFLICT (id) DO NOTHING;

  -- Climbs
  INSERT INTO public.climbs (id, gym_id, wall_id, name, color, discipline, gym_grade, setter_notes, active_from, qr_code_token) VALUES
    (climb1_id, gym1_id, wall1_id, 'Crimp Castle', 'Pink', 'bouldering', 'V4', 'Technical crimpy start into dynamic dyno at top.', CURRENT_DATE - INTERVAL '10 days', 'climb-crimp-castle-v4'),
    (climb2_id, gym1_id, wall1_id, 'Subzero Slopers', 'Blue', 'bouldering', 'V6', 'Wide compression slopers with high heel hook.', CURRENT_DATE - INTERVAL '5 days', 'climb-subzero-slopers-v6'),
    (climb3_id, gym1_id, wall2_id, 'Balance Beam', 'Yellow', 'bouldering', 'V3', 'Trust your rubber! Delicate feet and tiny volume edges.', CURRENT_DATE - INTERVAL '12 days', 'climb-balance-beam-v3'),
    (climb4_id, gym2_id, wall3_id, 'Dynamic Monarch', 'Black', 'bouldering', 'V4', 'Big double dyno with a soft landing.', CURRENT_DATE - INTERVAL '7 days', 'climb-dynamic-monarch-v4')
  ON CONFLICT (id) DO NOTHING;

  -- Ratings
  INSERT INTO public.ratings (climb_id, comparative_rating, quality_stars, comment) VALUES
    (climb1_id, 'harder', 4, 'Feelt like a solid V5! Crux is near the second pincher.'),
    (climb1_id, 'harder', 5, 'Super fun movement but definitely soft grade listed as V4. Should be V5.'),
    (climb1_id, 'as_graded', 4, 'Great crimps! Solid V4 for tall climbers, maybe harder for short climbers.'),
    (climb2_id, 'easier', 3, 'If you have good sloper technique this feels easier than V6, closer to V5.'),
    (climb2_id, 'as_graded', 5, 'Peak setting! Sloper friction is key.'),
    (climb3_id, 'easier', 4, 'Nice slab route. Felt pretty easy for a V3.'),
    (climb4_id, 'harder', 5, 'Gravity Lab tends to grade stiff! This V4 is harder than Summit Peak V5s.')
  ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;
