import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface UserSettings {
  id: string;
  user_id: string;
  active_theme_id: string | null;
  streak_freezes_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  variables: {
    // Core colors
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    // Gradients
    gradientPrimary: string;
    gradientAccent: string;
    gradientSubtle: string;
    gradientCard: string;
    // Shadows
    shadowSoft: string;
    shadowMedium: string;
    shadowGlow: string;
    // Special
    ring: string;
    streak: string;
    coin: string;
  };
  fontWeight?: 'normal' | 'medium' | 'bold';
  borderRadius?: string;
}

// Comprehensive theme configurations - each is visually unique
export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  // Default Theme (for reset)
  'default': {
    name: 'Default',
    description: 'Clean and calming default theme',
    preview: { primary: '#2DD4BF', secondary: '#F5F5F4', accent: '#F59E0B' },
    variables: {
      background: '160 20% 8%',
      foreground: '150 15% 95%',
      card: '160 18% 12%',
      cardForeground: '150 15% 95%',
      primary: '158 64% 48%',
      primaryForeground: '160 25% 8%',
      secondary: '160 15% 18%',
      secondaryForeground: '150 15% 85%',
      muted: '160 12% 20%',
      mutedForeground: '150 10% 55%',
      accent: '38 85% 55%',
      accentForeground: '38 85% 95%',
      border: '160 12% 22%',
      ring: '158 64% 48%',
      streak: '38 85% 55%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(158, 64%, 48%) 0%, hsl(170, 55%, 50%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(38, 85%, 55%) 0%, hsl(45, 90%, 55%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(160, 20%, 8%) 0%, hsl(160, 18%, 10%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(160, 18%, 12%) 0%, hsl(160, 15%, 10%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(0, 0%, 0%, 0.3)',
      shadowMedium: '0 4px 16px -4px hsla(0, 0%, 0%, 0.4)',
      shadowGlow: '0 0 20px hsla(158, 64%, 48%, 0.2)',
    },
  },
  
  // Ocean Theme - Deep blue with cyan accents
  '9aeb03c3-6841-4848-8382-2b03f16eb502': {
    name: 'Ocean Depths',
    description: 'Deep sea blues with cyan highlights',
    preview: { primary: '#0EA5E9', secondary: '#0C4A6E', accent: '#22D3EE' },
    variables: {
      background: '205 50% 6%',
      foreground: '200 20% 95%',
      card: '205 45% 10%',
      cardForeground: '200 20% 95%',
      primary: '199 89% 48%',
      primaryForeground: '205 50% 6%',
      secondary: '205 40% 16%',
      secondaryForeground: '200 20% 85%',
      muted: '205 35% 18%',
      mutedForeground: '200 15% 60%',
      accent: '188 94% 43%',
      accentForeground: '200 95% 10%',
      border: '205 35% 20%',
      ring: '199 89% 48%',
      streak: '188 94% 43%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(188, 94%, 43%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(188, 94%, 43%) 0%, hsl(174, 80%, 50%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(205, 50%, 6%) 0%, hsl(210, 45%, 8%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(205, 45%, 10%) 0%, hsl(210, 40%, 8%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(200, 80%, 30%, 0.3)',
      shadowMedium: '0 4px 16px -4px hsla(200, 80%, 30%, 0.4)',
      shadowGlow: '0 0 24px hsla(199, 89%, 48%, 0.3)',
    },
    borderRadius: '1rem',
  },
  
  // Forest Theme - Rich greens with earthy tones
  '4efdc88d-e772-458f-9f84-9a143ddc450f': {
    name: 'Enchanted Forest',
    description: 'Lush greens with golden highlights',
    preview: { primary: '#22C55E', secondary: '#14532D', accent: '#A3E635' },
    variables: {
      background: '140 30% 6%',
      foreground: '120 15% 95%',
      card: '140 25% 10%',
      cardForeground: '120 15% 95%',
      primary: '142 71% 45%',
      primaryForeground: '140 30% 6%',
      secondary: '140 25% 16%',
      secondaryForeground: '120 15% 85%',
      muted: '140 20% 18%',
      mutedForeground: '120 10% 55%',
      accent: '82 85% 55%',
      accentForeground: '82 85% 15%',
      border: '140 20% 22%',
      ring: '142 71% 45%',
      streak: '82 85% 55%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(142, 71%, 45%) 0%, hsl(82, 85%, 55%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(82, 85%, 55%) 0%, hsl(65, 80%, 55%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(140, 30%, 6%) 0%, hsl(145, 25%, 8%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(140, 25%, 10%) 0%, hsl(145, 22%, 8%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(140, 50%, 20%, 0.3)',
      shadowMedium: '0 4px 16px -4px hsla(140, 50%, 20%, 0.4)',
      shadowGlow: '0 0 24px hsla(142, 71%, 45%, 0.25)',
    },
    fontWeight: 'medium',
  },
  
  // Sunset Theme - Warm oranges and purples
  'c3e3cd5f-ab23-453d-bc6b-89d393b24bb9': {
    name: 'Golden Sunset',
    description: 'Warm oranges with purple twilight',
    preview: { primary: '#F97316', secondary: '#431407', accent: '#A855F7' },
    variables: {
      background: '15 30% 6%',
      foreground: '30 20% 95%',
      card: '15 28% 10%',
      cardForeground: '30 20% 95%',
      primary: '25 95% 53%',
      primaryForeground: '15 30% 6%',
      secondary: '15 25% 16%',
      secondaryForeground: '30 20% 85%',
      muted: '15 20% 18%',
      mutedForeground: '30 15% 55%',
      accent: '271 91% 65%',
      accentForeground: '271 91% 95%',
      border: '15 20% 22%',
      ring: '25 95% 53%',
      streak: '25 95% 53%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(350, 85%, 55%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(271, 91%, 65%) 0%, hsl(290, 80%, 60%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(15, 30%, 6%) 0%, hsl(20, 28%, 8%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(15, 28%, 10%) 0%, hsl(20, 25%, 8%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(25, 80%, 30%, 0.3)',
      shadowMedium: '0 4px 16px -4px hsla(25, 80%, 30%, 0.4)',
      shadowGlow: '0 0 24px hsla(25, 95%, 53%, 0.3)',
    },
  },
  
  // Midnight Theme - Deep purples with neon accents
  '3c10f581-4d3b-4ba2-a3d6-03ef7377d81e': {
    name: 'Midnight Aurora',
    description: 'Deep purple with neon glow effects',
    preview: { primary: '#A855F7', secondary: '#2E1065', accent: '#EC4899' },
    variables: {
      background: '270 40% 5%',
      foreground: '270 15% 95%',
      card: '270 35% 9%',
      cardForeground: '270 15% 95%',
      primary: '271 91% 65%',
      primaryForeground: '270 40% 5%',
      secondary: '270 30% 15%',
      secondaryForeground: '270 15% 85%',
      muted: '270 25% 17%',
      mutedForeground: '270 12% 55%',
      accent: '330 81% 60%',
      accentForeground: '330 81% 95%',
      border: '270 25% 20%',
      ring: '271 91% 65%',
      streak: '330 81% 60%',
      coin: '50 95% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(271, 91%, 65%) 0%, hsl(330, 81%, 60%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(330, 81%, 60%) 0%, hsl(350, 75%, 55%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(270, 40%, 5%) 0%, hsl(280, 38%, 7%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(270, 35%, 9%) 0%, hsl(280, 32%, 7%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(270, 80%, 30%, 0.4)',
      shadowMedium: '0 4px 16px -4px hsla(270, 80%, 30%, 0.5)',
      shadowGlow: '0 0 30px hsla(271, 91%, 65%, 0.35)',
    },
    borderRadius: '0.5rem',
  },
  
  // Dark Theme - Sleek minimal dark
  '16ba98d0-6ffe-4f69-8e09-dc91e729b5cf': {
    name: 'Carbon Black',
    description: 'Ultra-minimal monochrome design',
    preview: { primary: '#FAFAFA', secondary: '#171717', accent: '#A3A3A3' },
    variables: {
      background: '0 0% 4%',
      foreground: '0 0% 98%',
      card: '0 0% 7%',
      cardForeground: '0 0% 98%',
      primary: '0 0% 98%',
      primaryForeground: '0 0% 4%',
      secondary: '0 0% 12%',
      secondaryForeground: '0 0% 85%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 55%',
      accent: '0 0% 70%',
      accentForeground: '0 0% 10%',
      border: '0 0% 18%',
      ring: '0 0% 98%',
      streak: '38 85% 55%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(0, 0%, 98%) 0%, hsl(0, 0%, 80%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(0, 0%, 70%) 0%, hsl(0, 0%, 50%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(0, 0%, 4%) 0%, hsl(0, 0%, 6%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(0, 0%, 7%) 0%, hsl(0, 0%, 5%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(0, 0%, 0%, 0.5)',
      shadowMedium: '0 4px 16px -4px hsla(0, 0%, 0%, 0.6)',
      shadowGlow: '0 0 20px hsla(0, 0%, 98%, 0.08)',
    },
    fontWeight: 'normal',
  },
  
  // Additional Dark Theme ID
  '5d32cb83-8ae1-402b-8ff7-818e57baa009': {
    name: 'Carbon Black',
    description: 'Ultra-minimal monochrome design',
    preview: { primary: '#FAFAFA', secondary: '#171717', accent: '#A3A3A3' },
    variables: {
      background: '0 0% 4%',
      foreground: '0 0% 98%',
      card: '0 0% 7%',
      cardForeground: '0 0% 98%',
      primary: '0 0% 98%',
      primaryForeground: '0 0% 4%',
      secondary: '0 0% 12%',
      secondaryForeground: '0 0% 85%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 55%',
      accent: '0 0% 70%',
      accentForeground: '0 0% 10%',
      border: '0 0% 18%',
      ring: '0 0% 98%',
      streak: '38 85% 55%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(0, 0%, 98%) 0%, hsl(0, 0%, 80%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(0, 0%, 70%) 0%, hsl(0, 0%, 50%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(0, 0%, 4%) 0%, hsl(0, 0%, 6%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(0, 0%, 7%) 0%, hsl(0, 0%, 5%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(0, 0%, 0%, 0.5)',
      shadowMedium: '0 4px 16px -4px hsla(0, 0%, 0%, 0.6)',
      shadowGlow: '0 0 20px hsla(0, 0%, 98%, 0.08)',
    },
    fontWeight: 'normal',
  },
  
  // Zen Theme - Distinctly different with sage and warm tones
  '143c9bac-ed5a-4012-8688-ced0972f5867': {
    name: 'Zen Garden',
    description: 'Calming sage with warm stone accents',
    preview: { primary: '#84CC16', secondary: '#3F3D3A', accent: '#D4A574' },
    variables: {
      background: '40 8% 10%',
      foreground: '45 15% 92%',
      card: '40 10% 14%',
      cardForeground: '45 15% 92%',
      primary: '84 81% 44%',
      primaryForeground: '40 8% 10%',
      secondary: '40 8% 20%',
      secondaryForeground: '45 10% 80%',
      muted: '40 6% 22%',
      mutedForeground: '40 8% 55%',
      accent: '30 50% 65%',
      accentForeground: '30 50% 15%',
      border: '40 6% 25%',
      ring: '84 81% 44%',
      streak: '30 50% 65%',
      coin: '45 90% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(84, 81%, 44%) 0%, hsl(75, 65%, 50%) 100%)',
      gradientAccent: 'linear-gradient(135deg, hsl(30, 50%, 65%) 0%, hsl(35, 55%, 60%) 100%)',
      gradientSubtle: 'linear-gradient(135deg, hsl(40, 8%, 10%) 0%, hsl(35, 10%, 12%) 100%)',
      gradientCard: 'linear-gradient(145deg, hsl(40, 10%, 14%) 0%, hsl(35, 8%, 12%) 100%)',
      shadowSoft: '0 2px 8px -2px hsla(40, 20%, 10%, 0.3)',
      shadowMedium: '0 4px 16px -4px hsla(40, 20%, 10%, 0.4)',
      shadowGlow: '0 0 24px hsla(84, 81%, 44%, 0.2)',
    },
    fontWeight: 'medium',
    borderRadius: '1.25rem',
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

  const setActiveTheme = useMutation({
    mutationFn: async (themeId: string | null) => {
      if (!user) throw new Error('Not authenticated');
      
      // Ensure settings exist first
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingSettings) {
        const { data, error } = await supabase
          .from('user_settings')
          .insert([{ user_id: user.id, active_theme_id: themeId }])
          .select()
          .single();
        if (error) throw error;
        return data as UserSettings;
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({ active_theme_id: themeId })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      applyTheme(data.active_theme_id);
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

  // Apply theme to document - comprehensive variable update
  const applyTheme = (themeId: string | null) => {
    const root = document.documentElement;
    const config = themeId && THEME_CONFIGS[themeId] ? THEME_CONFIGS[themeId] : THEME_CONFIGS['default'];
    
    // Apply all CSS variables
    root.style.setProperty('--background', config.variables.background);
    root.style.setProperty('--foreground', config.variables.foreground);
    root.style.setProperty('--card', config.variables.card);
    root.style.setProperty('--card-foreground', config.variables.cardForeground);
    root.style.setProperty('--primary', config.variables.primary);
    root.style.setProperty('--primary-foreground', config.variables.primaryForeground);
    root.style.setProperty('--secondary', config.variables.secondary);
    root.style.setProperty('--secondary-foreground', config.variables.secondaryForeground);
    root.style.setProperty('--muted', config.variables.muted);
    root.style.setProperty('--muted-foreground', config.variables.mutedForeground);
    root.style.setProperty('--accent', config.variables.accent);
    root.style.setProperty('--accent-foreground', config.variables.accentForeground);
    root.style.setProperty('--border', config.variables.border);
    root.style.setProperty('--ring', config.variables.ring);
    root.style.setProperty('--streak', config.variables.streak);
    root.style.setProperty('--coin', config.variables.coin);
    
    // Apply gradients
    root.style.setProperty('--gradient-primary', config.variables.gradientPrimary);
    root.style.setProperty('--gradient-accent', config.variables.gradientAccent);
    root.style.setProperty('--gradient-subtle', config.variables.gradientSubtle);
    root.style.setProperty('--gradient-card', config.variables.gradientCard);
    
    // Apply shadows
    root.style.setProperty('--shadow-soft', config.variables.shadowSoft);
    root.style.setProperty('--shadow-medium', config.variables.shadowMedium);
    root.style.setProperty('--shadow-glow', config.variables.shadowGlow);
    
    // Apply radius if specified
    if (config.borderRadius) {
      root.style.setProperty('--radius', config.borderRadius);
    } else {
      root.style.setProperty('--radius', '0.75rem');
    }
    
    // Store in localStorage for persistence
    if (themeId) {
      localStorage.setItem('active-theme-id', themeId);
    } else {
      localStorage.removeItem('active-theme-id');
    }
  };

  // Reset to default theme
  const resetToDefault = () => {
    setActiveTheme.mutate(null);
    applyTheme(null);
  };

  // Auto-apply theme on mount
  useEffect(() => {
    if (settings?.active_theme_id) {
      applyTheme(settings.active_theme_id);
    } else {
      // Check localStorage as fallback
      const storedTheme = localStorage.getItem('active-theme-id');
      if (storedTheme && THEME_CONFIGS[storedTheme]) {
        applyTheme(storedTheme);
      }
    }
  }, [settings?.active_theme_id]);

  return {
    settings,
    isLoading,
    setActiveTheme,
    consumeStreakFreeze,
    addStreakFreezes,
    applyTheme,
    resetToDefault,
    hasStreakFreezes: (settings?.streak_freezes_remaining || 0) > 0,
    getThemeConfig: (id: string) => THEME_CONFIGS[id],
  };
}
