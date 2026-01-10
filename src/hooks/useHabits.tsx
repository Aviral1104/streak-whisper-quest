import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, subDays, isToday } from 'date-fns';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_days: number[];
  color: string;
  icon: string;
  custom_icon: string | null;
  current_streak: number;
  longest_streak: number;
  is_archived: boolean;
  habit_type: 'checkbox' | 'hours';
  target_hours_daily: number | null;
  target_hours_weekly: number | null;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
}

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['completions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('completed_at', thirtyDaysAgo)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const createHabit = useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_streak' | 'longest_streak' | 'is_archived'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('habits')
        .insert([{ ...habit, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created!');
    },
    onError: (error) => {
      toast.error('Failed to create habit');
      console.error(error);
    },
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted');
    },
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // CRITICAL: Enforce date-locking - only allow today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      if (date !== today) {
        throw new Error('Can only toggle habits for today');
      }
      
      // Get the habit to verify it's a checkbox type
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');
      
      // Only allow checkbox habits to use this toggle
      if (habit.habit_type === 'hours') {
        throw new Error('Use time logging for hour-based habits');
      }
      
      const existing = completions.find(
        c => c.habit_id === habitId && c.completed_at === date
      );

      if (existing) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Check for duplicate before inserting
        const { data: existingCheck } = await supabase
          .from('habit_completions')
          .select('id')
          .eq('habit_id', habitId)
          .eq('completed_at', date)
          .maybeSingle();
        
        if (existingCheck) {
          return { action: 'already_completed' };
        }
        
        const { error } = await supabase
          .from('habit_completions')
          .insert([{ habit_id: habitId, user_id: user.id, completed_at: date }]);
        if (error) throw error;
        
        // Award coins for completion
        await supabase.from('coin_transactions').insert([{
          user_id: user.id,
          amount: 10,
          type: 'earn',
          reason: 'Completed habit'
        }]);
        
        await supabase
          .from('profiles')
          .update({ coins: (profile?.coins || 0) + 10 })
          .eq('id', user.id);
        
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      
      if (result.action === 'added') {
        toast.success('+10 coins! 🪙');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isCompletedToday = (habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.completed_at === today);
  };

  const getCompletionsForDate = (date: string) => {
    return completions.filter(c => c.completed_at === date);
  };

  const getHabitCompletions = (habitId: string) => {
    return completions.filter(c => c.habit_id === habitId);
  };

  return {
    habits,
    completions,
    profile,
    isLoading: habitsLoading || completionsLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompletedToday,
    getCompletionsForDate,
    getHabitCompletions,
  };
}
