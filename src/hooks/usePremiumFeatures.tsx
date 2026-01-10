import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRewards } from './useRewards';
import { toast } from 'sonner';

// Premium feature reward IDs
const PREMIUM_FEATURE_IDS = {
  WEEKLY_REPORTS: '2f872f5d-8b86-4caa-9ca9-98ed2e5c6465',
  ANALYTICS_PRO: 'c0b6cf51-f230-4ed3-9ca9-58c8b2964c1c',
  CUSTOM_ICONS: 'e0ede08c-0057-4fad-9a14-a542eeed1c34',
};

// Premium custom icons collection
export const PREMIUM_ICONS = [
  '🎯', '🏆', '💪', '🧠', '📚', '✍️', '🎨', '🎵', '🎮', '🏃',
  '🧘', '🏋️', '🚴', '🏊', '⚽', '🎾', '🏀', '🎳', '⛳', '🥊',
  '💼', '📊', '💰', '📈', '🔬', '💻', '📱', '🔧', '🛠️', '⚙️',
  '🍎', '🥗', '💧', '😴', '🌅', '🌙', '☀️', '🌿', '🌸', '🍃',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤', '💝', '✨',
];

export function usePremiumFeatures() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasReward } = useRewards();

  // Check if user owns premium features
  const hasWeeklyReports = hasReward(PREMIUM_FEATURE_IDS.WEEKLY_REPORTS);
  const hasAnalyticsPro = hasReward(PREMIUM_FEATURE_IDS.ANALYTICS_PRO);
  const hasCustomIcons = hasReward(PREMIUM_FEATURE_IDS.CUSTOM_ICONS);

  // Get user settings for premium features
  const { data: premiumSettings } = useQuery({
    queryKey: ['premium_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('has_weekly_reports, has_analytics_pro, has_custom_icons, weekly_reports_enabled, last_weekly_report_sent_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const weeklyReportsEnabled = premiumSettings?.weekly_reports_enabled ?? false;

  // Toggle weekly reports
  const toggleWeeklyReports = async () => {
    if (!user || !hasWeeklyReports) {
      toast.error('Unlock Weekly Reports first!');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ weekly_reports_enabled: !weeklyReportsEnabled })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['premium_settings'] });
      toast.success(weeklyReportsEnabled ? 'Weekly reports disabled' : 'Weekly reports enabled!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Activate premium feature after purchase
  const activatePremiumFeature = useMutation({
    mutationFn: async (featureId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const updates: Record<string, boolean> = {};
      
      if (featureId === PREMIUM_FEATURE_IDS.WEEKLY_REPORTS) {
        updates.has_weekly_reports = true;
        updates.weekly_reports_enabled = true;
      } else if (featureId === PREMIUM_FEATURE_IDS.ANALYTICS_PRO) {
        updates.has_analytics_pro = true;
      } else if (featureId === PREMIUM_FEATURE_IDS.CUSTOM_ICONS) {
        updates.has_custom_icons = true;
      }
      
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return featureId;
    },
    onSuccess: (featureId) => {
      queryClient.invalidateQueries({ queryKey: ['premium_settings'] });
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      
      const names: Record<string, string> = {
        [PREMIUM_FEATURE_IDS.WEEKLY_REPORTS]: 'Weekly Reports',
        [PREMIUM_FEATURE_IDS.ANALYTICS_PRO]: 'Analytics Pro',
        [PREMIUM_FEATURE_IDS.CUSTOM_ICONS]: 'Custom Icons Pack',
      };
      
      toast.success(`${names[featureId] || 'Feature'} activated!`);
    },
  });

  return {
    hasWeeklyReports,
    hasAnalyticsPro,
    hasCustomIcons,
    weeklyReportsEnabled,
    premiumSettings,
    toggleWeeklyReports,
    activatePremiumFeature,
    PREMIUM_ICONS,
    PREMIUM_FEATURE_IDS,
  };
}
