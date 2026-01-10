-- Add premium features tracking to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS has_weekly_reports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_analytics_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_custom_icons BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_reports_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_weekly_report_sent_at TIMESTAMP WITH TIME ZONE;

-- Add icon column to habits for custom icons feature
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS custom_icon TEXT;

-- Create weekly_reports table to track sent reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_week_start DATE NOT NULL,
  report_week_end DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent_to TEXT NOT NULL,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on weekly_reports
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_reports
CREATE POLICY "Users can view own reports" ON weekly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports" ON weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);