import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format, parseISO, differenceInMinutes } from 'date-fns';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color: string;
  linked_habit_id: string | null;
  reminder_minutes: number | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useEvents(selectedMonth?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const month = selectedMonth || new Date();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', user?.id, format(month, 'yyyy-MM')],
    queryFn: async () => {
      if (!user) return [];
      
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created!');
    },
    onError: (error) => {
      toast.error('Failed to create event');
      console.error(error);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
    },
  });

  const completeEvent = useMutation({
    mutationFn: async ({ eventId, logHours }: { eventId: string; logHours?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      // Mark event as completed
      const { error } = await supabase
        .from('events')
        .update({ is_completed: true })
        .eq('id', eventId);
      
      if (error) throw error;

      // If event is linked to an hour-based habit and logHours is true, log the hours
      if (event.linked_habit_id && logHours) {
        const durationHours = differenceInMinutes(parseISO(event.end_time), parseISO(event.start_time)) / 60;
        const date = format(parseISO(event.start_time), 'yyyy-MM-dd');
        
        // Get existing log for this habit on this date
        const { data: existingLog } = await supabase
          .from('time_logs')
          .select('*')
          .eq('habit_id', event.linked_habit_id)
          .eq('logged_at', date)
          .maybeSingle();

        if (existingLog) {
          await supabase
            .from('time_logs')
            .update({ hours: existingLog.hours + durationHours })
            .eq('id', existingLog.id);
        } else {
          await supabase
            .from('time_logs')
            .insert([{
              habit_id: event.linked_habit_id,
              user_id: user.id,
              logged_at: date,
              hours: durationHours,
              notes: `From event: ${event.title}`
            }]);
        }

        return { hoursLogged: durationHours };
      }

      return { hoursLogged: 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      
      if (result.hoursLogged > 0) {
        toast.success(`Event completed! ${result.hoursLogged.toFixed(1)}h logged to habit`);
      } else {
        toast.success('Event completed!');
      }
    },
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => format(parseISO(e.start_time), 'yyyy-MM-dd') === dateStr);
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    completeEvent,
    getEventsForDate,
  };
}
