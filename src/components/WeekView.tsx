import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { HabitCompletion, Habit } from '@/hooks/useHabits';

interface WeekViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggle: (habitId: string, date: string) => void;
}

export default function WeekView({ habits, completions, onToggle }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const isCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.completed_at === dateStr);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-6 overflow-x-auto"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">This Week</h3>
        <p className="text-sm text-muted-foreground">Track your daily progress</p>
      </div>

      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-3">
          <div className="text-sm font-medium text-muted-foreground">Habit</div>
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()} 
              className={cn(
                "text-center text-sm font-medium",
                isToday(day) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div>{format(day, 'EEE')}</div>
              <div className={cn(
                "text-xs",
                isToday(day) && "font-semibold"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet. Create your first habit to start tracking!
          </div>
        ) : (
          habits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-2"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg">{habit.icon}</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {habit.name}
                </span>
              </div>
              {weekDays.map((day) => {
                const completed = isCompleted(habit.id, day);
                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = day < new Date() && !isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onToggle(habit.id, dateStr)}
                    disabled={day > new Date()}
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-center transition-all",
                      completed 
                        ? "gradient-primary shadow-glow" 
                        : isPast
                          ? "bg-muted/50"
                          : "bg-secondary hover:bg-primary/10",
                      day > new Date() && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {completed && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary-foreground text-lg"
                      >
                        ✓
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
