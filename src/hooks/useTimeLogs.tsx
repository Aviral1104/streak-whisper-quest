import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface TimeLog {
  id: string;
  user_id: string;
  habit_id: string;
  logged_at: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

export function useTimeLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: timeLogs = [], isLoading } = useQuery({
    queryKey: ['time_logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .gte('logged_at', thirtyDaysAgo)
        .order('logged_at', { ascending: false });
      
      if (error) throw error;
      return data as TimeLog[];
    },
    enabled: !!user,
  });

  const logTime = useMutation({
    mutationFn: async ({ habitId, hours, date, notes }: { habitId: string; hours: number; date: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if there's an existing log for this habit on this date
      const existing = timeLogs.find(
        log => log.habit_id === habitId && log.logged_at === date
      );

      if (existing) {
        // Update existing log
        const { data, error } = await supabase
          .from('time_logs')
          .update({ hours, notes: notes || null })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return { action: 'updated', data };
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('time_logs')
          .insert([{ habit_id: habitId, user_id: user.id, logged_at: date, hours, notes: notes || null }])
          .select()
          .single();
        
        if (error) throw error;

        // Award coins for logging time (5 coins per hour, max 50 per day)
        const coinsEarned = Math.min(Math.round(hours * 5), 50);
        if (coinsEarned > 0) {
          await supabase.from('coin_transactions').insert([{
            user_id: user.id,
            amount: coinsEarned,
            type: 'earn',
            reason: `Logged ${hours}h on habit`
          }]);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            await supabase
              .from('profiles')
              .update({ coins: profile.coins + coinsEarned })
              .eq('id', user.id);
          }
        }

        return { action: 'created', data, coinsEarned };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      if (result.action === 'created' && result.coinsEarned) {
        toast.success(`+${result.coinsEarned} coins! 🪙`);
      } else {
        toast.success('Time logged!');
      }
    },
    onError: (error) => {
      toast.error('Failed to log time');
      console.error(error);
    },
  });

  const deleteTimeLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      toast.success('Time log deleted');
    },
  });

  const getHoursForDate = (habitId: string, date: string) => {
    const log = timeLogs.find(l => l.habit_id === habitId && l.logged_at === date);
    return log?.hours || 0;
  };

  const getTotalHoursForWeek = (habitId: string, date: Date = new Date()) => {
    const start = format(startOfWeek(date), 'yyyy-MM-dd');
    const end = format(endOfWeek(date), 'yyyy-MM-dd');
    
    return timeLogs
      .filter(l => l.habit_id === habitId && l.logged_at >= start && l.logged_at <= end)
      .reduce((sum, l) => sum + l.hours, 0);
  };

  const getTotalHoursForMonth = (habitId: string, date: Date = new Date()) => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    
    return timeLogs
      .filter(l => l.habit_id === habitId && l.logged_at >= start && l.logged_at <= end)
      .reduce((sum, l) => sum + l.hours, 0);
  };

  const getTotalHoursAllTime = (habitId: string) => {
    return timeLogs
      .filter(l => l.habit_id === habitId)
      .reduce((sum, l) => sum + l.hours, 0);
  };

  return {
    timeLogs,
    isLoading,
    logTime,
    deleteTimeLog,
    getHoursForDate,
    getTotalHoursForWeek,
    getTotalHoursForMonth,
    getTotalHoursAllTime,
  };
}
