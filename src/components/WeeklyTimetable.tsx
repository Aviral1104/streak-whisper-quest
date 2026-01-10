import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClockState } from '@/hooks/useNativeClock';
import type { Habit } from '@/hooks/useHabits';
import type { HabitCompletion } from '@/hooks/useHabits';
import type { TimeLog } from '@/hooks/useTimeLogs';

interface WeeklyTimetableProps {
  habits: Habit[];
  completions: HabitCompletion[];
  timeLogs: TimeLog[];
  clockState: ClockState;
  currentWeekOffset?: number;
  onWeekChange?: (offset: number) => void;
}

// Working hours to display (6 AM to 11 PM)
const HOUR_START = 6;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

export default function WeeklyTimetable({
  habits,
  completions,
  timeLogs,
  clockState,
  currentWeekOffset = 0,
  onWeekChange,
}: WeeklyTimetableProps) {
  const [weekOffset, setWeekOffset] = useState(currentWeekOffset);

  const weekDays = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const timeBasedHabits = habits.filter(h => h.habit_type === 'hours');
  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');

  // Create a map of logged hours by date and hour for quick lookup
  const loggedHoursMap = useMemo(() => {
    const map = new Map<string, { habit: Habit; hours: number }[]>();
    
    timeLogs.forEach(log => {
      const key = log.logged_at;
      const habit = habits.find(h => h.id === log.habit_id);
      if (habit) {
        const existing = map.get(key) || [];
        existing.push({ habit, hours: log.hours });
        map.set(key, existing);
      }
    });
    
    return map;
  }, [timeLogs, habits]);

  // Create a map of completions by date
  const completionsMap = useMemo(() => {
    const map = new Map<string, HabitCompletion[]>();
    
    completions.forEach(comp => {
      const key = comp.completed_at;
      const existing = map.get(key) || [];
      existing.push(comp);
      map.set(key, existing);
    });
    
    return map;
  }, [completions]);

  const handleWeekChange = (delta: number) => {
    const newOffset = weekOffset + delta;
    setWeekOffset(newOffset);
    onWeekChange?.(newOffset);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Weekly Timetable</h3>
          <p className="text-sm text-muted-foreground">Hour-by-hour activity tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleWeekChange(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className={cn(weekOffset === 0 && "bg-primary/10")}
          >
            This Week
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleWeekChange(1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
            <div className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/30">
              Hour
            </div>
            {weekDays.map((day) => {
              const isCurrentDay = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center border-l border-border",
                    isCurrentDay && "bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium",
                    isCurrentDay ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-sm font-semibold",
                    isCurrentDay ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          <div className="max-h-[500px] overflow-y-auto">
            {HOURS.map((hour) => {
              const isCurrentHour = clockState.currentHourSegment === hour && weekOffset === 0;
              
              return (
                <div
                  key={hour}
                  className={cn(
                    "grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50",
                    isCurrentHour && "bg-primary/5"
                  )}
                >
                  {/* Hour label */}
                  <div className={cn(
                    "p-2 text-center text-xs font-mono",
                    isCurrentHour ? "text-primary font-bold" : "text-muted-foreground",
                    "bg-muted/20 flex items-center justify-center"
                  )}>
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrentDay = isToday(day);
                    const isCurrentCell = isCurrentDay && isCurrentHour;
                    const isPast = day < new Date() && !isToday(day);
                    const isFuture = day > new Date();
                    const isPastHour = isCurrentDay && hour < clockState.currentHourSegment;
                    const isFutureHour = isCurrentDay && hour > clockState.currentHourSegment;

                    // Get logged data for this cell
                    const dayLogs = loggedHoursMap.get(dateStr) || [];
                    const dayCompletions = completionsMap.get(dateStr) || [];

                    // Calculate what portion of time logs falls into this hour (simplified)
                    const hasActivity = dayLogs.length > 0 || dayCompletions.length > 0;
                    const isLocked = isFuture || (isCurrentDay && isFutureHour);

                    return (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-10 border-l border-border/30 relative transition-all",
                              isCurrentCell && "ring-2 ring-primary ring-inset",
                              isPast && hasActivity && "bg-primary/20",
                              isPastHour && hasActivity && "bg-primary/15",
                              isLocked && "bg-muted/10",
                              !isLocked && !hasActivity && "hover:bg-muted/20"
                            )}
                          >
                            {/* Current hour indicator */}
                            {isCurrentCell && (
                              <motion.div
                                className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}

                            {/* Activity indicators */}
                            <div className="flex items-center justify-center h-full gap-1 px-1">
                              {isLocked && (
                                <Lock className="w-3 h-3 text-muted-foreground/30" />
                              )}
                              
                              {!isLocked && dayLogs.length > 0 && (
                                <div className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span className="text-[10px] font-medium text-primary">
                                    {dayLogs.reduce((s, l) => s + l.hours, 0).toFixed(1)}h
                                  </span>
                                </div>
                              )}
                              
                              {!isLocked && dayCompletions.length > 0 && (
                                <div className="flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                  <span className="text-[10px] font-medium text-success">
                                    {dayCompletions.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <div className="text-xs space-y-1">
                            <div className="font-medium">
                              {format(day, 'EEE, MMM d')} at {hour}:00
                            </div>
                            {isLocked ? (
                              <div className="text-muted-foreground">Locked (future)</div>
                            ) : hasActivity ? (
                              <>
                                {dayLogs.map((log, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span>{log.habit.icon}</span>
                                    <span>{log.habit.name}: {log.hours}h</span>
                                  </div>
                                ))}
                                {dayCompletions.map((comp, i) => {
                                  const habit = checkboxHabits.find(h => h.id === comp.habit_id);
                                  return habit ? (
                                    <div key={i} className="flex items-center gap-1">
                                      <span>{habit.icon}</span>
                                      <span>{habit.name} ✓</span>
                                    </div>
                                  ) : null;
                                })}
                              </>
                            ) : (
                              <div className="text-muted-foreground">No activity</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>Logged time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-2 ring-primary" />
          <span>Current hour</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Locked (future)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-success" />
          <span>Completed</span>
        </div>
      </div>
    </motion.div>
  );
}
