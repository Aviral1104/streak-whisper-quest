import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isToday, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { Lock, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { HabitCompletion, Habit } from '@/hooks/useHabits';
import type { TimeLog } from '@/hooks/useTimeLogs';

interface WeekViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  timeLogs?: TimeLog[];
  onToggle: (habitId: string, date: string) => void;
}

export default function WeekView({ habits, completions, timeLogs = [], onToggle }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const isCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.completed_at === dateStr);
  };

  const getHoursLogged = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = timeLogs.find(l => l.habit_id === habitId && l.logged_at === dateStr);
    return log?.hours || 0;
  };

  const canInteract = (date: Date) => isToday(date);

  // Separate habits by type
  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');
  const timeBasedHabits = habits.filter(h => h.habit_type === 'hours');

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

        {/* Checkbox Habits */}
        {checkboxHabits.length === 0 && timeBasedHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet. Create your first habit to start tracking!
          </div>
        ) : (
          <>
            {checkboxHabits.map((habit, index) => (
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
                  const isPastDay = !isToday(day) && !isFuture(day);
                  const isFutureDay = isFuture(day);
                  const isLocked = !canInteract(day);
                  
                  return (
                    <Tooltip key={day.toISOString()}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !isLocked && onToggle(habit.id, dateStr)}
                          disabled={isLocked}
                          className={cn(
                            "h-10 rounded-lg flex items-center justify-center transition-all relative",
                            !isLocked && "hover:scale-105 active:scale-95",
                            completed && !isLocked && "gradient-primary shadow-glow",
                            completed && isLocked && isPastDay && "bg-primary/60",
                            !completed && !isLocked && "bg-secondary hover:bg-primary/10",
                            !completed && isLocked && "bg-muted/30",
                            isLocked && "cursor-not-allowed opacity-70"
                          )}
                        >
                          {completed ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={cn(
                                "text-primary-foreground text-lg",
                                isLocked && "opacity-70"
                              )}
                            >
                              ✓
                            </motion.span>
                          ) : isLocked ? (
                            <Lock className="w-3 h-3 text-muted-foreground/50" />
                          ) : null}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isToday(day) 
                          ? completed 
                            ? "Click to undo" 
                            : "Click to complete"
                          : isPastDay
                            ? "Past days are locked"
                            : "Future days are locked"
                        }
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </motion.div>
            ))}

            {/* Time-based Habits Section */}
            {timeBasedHabits.length > 0 && (
              <>
                <div className="border-t border-border/50 my-4 pt-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Time-tracked habits (view only - log time from Dashboard)
                  </div>
                </div>
                {timeBasedHabits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (checkboxHabits.length + index) * 0.05 }}
                    className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {habit.name}
                      </span>
                    </div>
                    {weekDays.map((day) => {
                      const hoursLogged = getHoursLogged(habit.id, day);
                      const target = habit.target_hours_daily || 1;
                      const percentage = Math.min((hoursLogged / target) * 100, 100);
                      const isMet = hoursLogged >= target;
                      
                      return (
                        <Tooltip key={day.toISOString()}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-10 rounded-lg flex flex-col items-center justify-center relative",
                                isMet && "bg-primary/20",
                                !isMet && hoursLogged > 0 && "bg-primary/10",
                                hoursLogged === 0 && "bg-muted/30"
                              )}
                            >
                              <span className={cn(
                                "text-xs font-medium",
                                isMet ? "text-primary" : "text-muted-foreground"
                              )}>
                                {hoursLogged > 0 ? `${hoursLogged.toFixed(1)}h` : '-'}
                              </span>
                              {hoursLogged > 0 && (
                                <div className="w-6 h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                                  <div 
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hoursLogged > 0 
                              ? `${hoursLogged.toFixed(1)}h / ${target}h (${Math.round(percentage)}%)`
                              : `No time logged - Target: ${target}h/day`
                            }
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </motion.div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
