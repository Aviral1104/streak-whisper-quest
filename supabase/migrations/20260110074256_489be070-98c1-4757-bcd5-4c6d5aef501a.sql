-- Add Time Rewind premium reward
INSERT INTO public.rewards (id, name, description, type, icon, cost, is_active)
VALUES (
  'd7f8e9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
  'Time Rewind',
  'Edit one previous day''s habit completion (last 7 days only). Single use.',
  'badge',
  '⏪',
  2000,
  true
);

-- Add has_time_rewind column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS has_time_rewind BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS time_rewind_last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;