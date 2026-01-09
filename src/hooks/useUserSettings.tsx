import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  active_theme_id: string | null;
  streak_freezes_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  icon: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    card: string;
  };
}

// Map theme reward IDs to their CSS configurations
export const THEME_CONFIGS: Record<string, Omit<ThemeConfig, 'id' | 'name' | 'icon'>> = {
  // Ocean Theme
  '9aeb03c3-6841-4848-8382-2b03f16eb502': {
    colors: {
      primary: '200 80% 50%',
      accent: '180 70% 45%',
      background: '200 30% 12%',
      card: '200 25% 16%',
    }
  },
  // Forest Theme
  '4efdc88d-e772-458f-9f84-9a143ddc450f': {
    colors: {
      primary: '142 70% 45%',
      accent: '120 60% 40%',
      background: '140 20% 10%',
      card: '140 18% 14%',
    }
  },
  // Sunset Theme
  'c3e3cd5f-ab23-453d-bc6b-89d393b24bb9': {
    colors: {
      primary: '25 95% 55%',
      accent: '350 80% 55%',
      background: '20 20% 10%',
      card: '20 18% 14%',
    }
  },
  // Midnight Theme (multiple IDs)
  '3c10f581-4d3b-4ba2-a3d6-03ef7377d81e': {
    colors: {
      primary: '260 80% 60%',
      accent: '280 70% 50%',
      background: '260 25% 8%',
      card: '260 20% 12%',
    }
  },
  // Dark Theme
  '16ba98d0-6ffe-4f69-8e09-dc91e729b5cf': {
    colors: {
      primary: '210 90% 55%',
      accent: '210 80% 45%',
      background: '220 20% 8%',
      card: '220 18% 12%',
    }
  },
  '5d32cb83-8ae1-402b-8ff7-818e57baa009': {
    colors: {
      primary: '210 90% 55%',
      accent: '210 80% 45%',
      background: '220 20% 8%',
      card: '220 18% 12%',
    }
  },
  // Zen Theme
  '143c9bac-ed5a-4012-8688-ced0972f5867': {
    colors: {
      primary: '170 50% 50%',
      accent: '160 45% 45%',
      background: '170 15% 10%',
      card: '170 12% 14%',
    }
  },
};

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert([{ user_id: user.id }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }
      
      return data as UserSettings;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<UserSettings, 'active_theme_id' | 'streak_freezes_remaining'>>) => {
      if (!user || !settings) throw new Error('Not authenticated or settings not loaded');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });

  const setActiveTheme = useMutation({
    mutationFn: async (themeId: string | null) => {
      if (!user || !settings) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({ active_theme_id: themeId })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      toast.success('Theme applied!');
    },
  });

  const consumeStreakFreeze = useMutation({
    mutationFn: async () => {
      if (!user || !settings || settings.streak_freezes_remaining < 1) {
        throw new Error('No streak freezes available');
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({ streak_freezes_remaining: settings.streak_freezes_remaining - 1 })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      toast.success('Streak freeze used! Your streak is protected.');
    },
  });

  const addStreakFreezes = useMutation({
    mutationFn: async (count: number) => {
      if (!user || !settings) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({ streak_freezes_remaining: settings.streak_freezes_remaining + count })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });

  // Apply theme to document
  const applyTheme = (themeId: string | null) => {
    const root = document.documentElement;
    
    if (!themeId || !THEME_CONFIGS[themeId]) {
      // Reset to default theme
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--background');
      root.style.removeProperty('--card');
      return;
    }
    
    const config = THEME_CONFIGS[themeId];
    root.style.setProperty('--primary', config.colors.primary);
    root.style.setProperty('--accent', config.colors.accent);
    root.style.setProperty('--background', config.colors.background);
    root.style.setProperty('--card', config.colors.card);
  };

  return {
    settings,
    isLoading,
    updateSettings,
    setActiveTheme,
    consumeStreakFreeze,
    addStreakFreezes,
    applyTheme,
    hasStreakFreezes: (settings?.streak_freezes_remaining || 0) > 0,
  };
}
