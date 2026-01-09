-- Add habit_type column to habits table (checkbox vs hour-based)
ALTER TABLE public.habits 
ADD COLUMN habit_type text NOT NULL DEFAULT 'checkbox',
ADD COLUMN target_hours_daily numeric NULL,
ADD COLUMN target_hours_weekly numeric NULL;

-- Create time_logs table for tracking hours on hour-based habits
CREATE TABLE public.time_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for time_logs
CREATE POLICY "Users can view own time logs" ON public.time_logs 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time logs" ON public.time_logs 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time logs" ON public.time_logs 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time logs" ON public.time_logs 
FOR DELETE USING (auth.uid() = user_id);

-- Create events table for the calendar planner
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  color text DEFAULT '#3B82F6',
  linked_habit_id uuid NULL REFERENCES public.habits(id) ON DELETE SET NULL,
  reminder_minutes integer NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view own events" ON public.events 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events" ON public.events 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.events 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.events 
FOR DELETE USING (auth.uid() = user_id);

-- Update default coins for new users to 10000 in the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, coins)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    10000
  );
  RETURN NEW;
END;
$function$;

-- Add new reward types (update type constraint to allow more types)
-- First insert new rewards
INSERT INTO public.rewards (name, description, icon, cost, type, is_active) VALUES
('Analytics Pro', 'Unlock advanced habit analytics and insights', '📊', 2000, 'badge', true),
('Custom Icons Pack', 'Access 50+ premium custom habit icons', '🎨', 1500, 'badge', true),
('Weekly Report', 'Get detailed weekly email reports', '📧', 1000, 'badge', true),
('Extended Freeze (3 days)', 'Protect your streak for 3 consecutive days', '❄️', 300, 'streak_freeze', true),
('Extended Freeze (7 days)', 'Protect your streak for a full week', '🧊', 600, 'streak_freeze', true),
('Midnight Theme', 'A deep dark theme for late-night sessions', '🌙', 500, 'theme', true),
('Ocean Theme', 'Calm blue tones inspired by the sea', '🌊', 500, 'theme', true),
('Nature Theme', 'Fresh greens and earth tones', '🌿', 500, 'theme', true);