import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, getDay, isSameMonth, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, Calendar, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Habit, HabitCompletion } from '@/hooks/useHabits';
import type { TimeLog } from '@/hooks/useTimeLogs';

interface HabitAnalyticsProps {
  habits: Habit[];
  completions: HabitCompletion[];
  timeLogs: TimeLog[];
}

export default function HabitAnalytics({ habits, completions, timeLogs }: HabitAnalyticsProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const isTimeBasedHabit = selectedHabit?.habit_type === 'hours';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get completions/hours for a specific date
  const getDateData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (selectedHabitId === 'all') {
      const dayCompletions = completions.filter(c => c.completed_at === dateStr);
      const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');
      return {
        count: dayCompletions.length,
        total: checkboxHabits.length,
        percentage: checkboxHabits.length > 0 ? (dayCompletions.length / checkboxHabits.length) * 100 : 0,
        hours: timeLogs.filter(l => l.logged_at === dateStr).reduce((sum, l) => sum + l.hours, 0),
      };
    }
    
    if (isTimeBasedHabit) {
      const log = timeLogs.find(l => l.habit_id === selectedHabitId && l.logged_at === dateStr);
      const target = selectedHabit?.target_hours_daily || 1;
      return {
        hours: log?.hours || 0,
        target,
        percentage: log ? (log.hours / target) * 100 : 0,
      };
    }
    
    const completed = completions.some(c => c.habit_id === selectedHabitId && c.completed_at === dateStr);
    return { completed, percentage: completed ? 100 : 0 };
  };

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let totalCompleted = 0;
    let totalPossible = 0;
    let totalHours = 0;
    let targetHours = 0;
    let perfectDays = 0;

    monthDays.forEach(day => {
      const data = getDateData(day);
      
      if (selectedHabitId === 'all') {
        totalCompleted += data.count || 0;
        totalPossible += data.total || 0;
        totalHours += data.hours || 0;
        if (data.percentage === 100 && (data.total || 0) > 0) perfectDays++;
      } else if (isTimeBasedHabit) {
        totalHours += data.hours || 0;
        targetHours += data.target || 0;
        if ((data.hours || 0) >= (data.target || 0)) perfectDays++;
      } else {
        if (data.completed) {
          totalCompleted++;
          perfectDays++;
        }
        totalPossible++;
      }
    });

    return {
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      totalCompleted,
      totalPossible,
      totalHours: Math.round(totalHours * 10) / 10,
      targetHours: Math.round(targetHours * 10) / 10,
      perfectDays,
      daysInMonth: monthDays.length,
    };
  }, [selectedHabitId, monthDays, completions, timeLogs, habits]);

  // Calculate weekly consistency bars
  const weeklyData = useMemo(() => {
    const weeks: { weekNum: number; label: string; percentage: number; hours?: number }[] = [];
    let weekStart = startOfWeek(monthStart);
    let weekNum = 1;

    while (weekStart <= monthEnd) {
      const weekEnd = endOfWeek(weekStart);
      const weekDays = eachDayOfInterval({ 
        start: weekStart < monthStart ? monthStart : weekStart, 
        end: weekEnd > monthEnd ? monthEnd : weekEnd 
      }).filter(d => isSameMonth(d, currentMonth));

      let completed = 0;
      let total = 0;
      let hours = 0;

      weekDays.forEach(day => {
        const data = getDateData(day);
        if (selectedHabitId === 'all') {
          completed += data.count || 0;
          total += data.total || 0;
          hours += data.hours || 0;
        } else if (isTimeBasedHabit) {
          hours += data.hours || 0;
          if ((data.hours || 0) >= (data.target || 0)) completed++;
          total++;
        } else {
          if (data.completed) completed++;
          total++;
        }
      });

      weeks.push({
        weekNum,
        label: `${format(weekDays[0], 'MMM d')} - ${format(weekDays[weekDays.length - 1], 'd')}`,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        hours: Math.round(hours * 10) / 10,
      });

      weekStart = addDays(weekEnd, 1);
      weekNum++;
    }

    return weeks;
  }, [selectedHabitId, currentMonth, completions, timeLogs, habits]);

  // Heatmap intensity (0-4 levels)
  const getIntensity = (percentage: number): number => {
    if (percentage === 0) return 0;
    if (percentage < 25) return 1;
    if (percentage < 50) return 2;
    if (percentage < 75) return 3;
    return 4;
  };

  const intensityColors = [
    'bg-muted/30',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary/90',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with Habit Selector */}
      <Card className="bg-card border border-border rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
              Habit Analytics
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select habit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Habits</SelectItem>
                  {habits.map(habit => (
                    <SelectItem key={habit.id} value={habit.id}>
                      <span className="flex items-center gap-2">
                        <span>{habit.icon}</span>
                        {habit.name}
                        {habit.habit_type === 'hours' && (
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Monthly Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              className="bg-primary/10 rounded-xl p-4 text-center"
            >
              <div className="text-3xl font-bold text-primary">
                {isTimeBasedHabit || selectedHabitId === 'all' ? 
                  `${monthlyStats.totalHours}h` : 
                  `${monthlyStats.completionRate}%`
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isTimeBasedHabit ? 'Total Hours' : 'Completion Rate'}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-accent/10 rounded-xl p-4 text-center"
            >
              <div className="text-3xl font-bold text-accent">
                {monthlyStats.perfectDays}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isTimeBasedHabit ? 'Target Met Days' : 'Perfect Days'}
              </div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-streak/10 rounded-xl p-4 text-center"
            >
              <div className="text-3xl font-bold text-streak">
                {selectedHabit?.current_streak || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Current Streak</div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-muted rounded-xl p-4 text-center"
            >
              <div className="text-3xl font-bold text-foreground">
                {selectedHabit?.longest_streak || monthlyStats.totalCompleted}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedHabitId !== 'all' ? 'Best Streak' : 'Total Completions'}
              </div>
            </motion.div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-3 mb-6">
              <TabsTrigger value="daily" className="gap-1 text-xs">
                <Calendar className="w-3 h-3" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1 text-xs">
                <BarChart3 className="w-3 h-3" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-1 text-xs">
                <TrendingUp className="w-3 h-3" />
                Trends
              </TabsTrigger>
            </TabsList>

            {/* Calendar Heatmap */}
            <TabsContent value="daily">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>How consistent were you this month?</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    {intensityColors.map((color, i) => (
                      <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const data = getDateData(day);
                    const inMonth = isSameMonth(day, currentMonth);
                    const intensity = getIntensity(data.percentage || 0);
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.005 }}
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center text-xs relative group cursor-default',
                          !inMonth && 'opacity-20',
                          inMonth && intensityColors[intensity]
                        )}
                      >
                        <span className={cn(
                          'font-medium',
                          intensity >= 3 ? 'text-primary-foreground' : 'text-foreground'
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-medium">
                          <div className="font-medium">{format(day, 'MMM d, yyyy')}</div>
                          {isTimeBasedHabit ? (
                            <div className="text-muted-foreground">
                              {(data as any).hours || 0}h / {(data as any).target || 0}h
                            </div>
                          ) : selectedHabitId === 'all' ? (
                            <div className="text-muted-foreground">
                              {(data as any).count || 0}/{(data as any).total || 0} habits
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              {(data as any).completed ? '✓ Completed' : 'Not completed'}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Weekly Bars */}
            <TabsContent value="weekly">
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  Weekly consistency breakdown
                </div>
                
                <div className="space-y-3">
                  {weeklyData.map((week, idx) => (
                    <motion.div
                      key={week.weekNum}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-28 text-xs text-muted-foreground shrink-0">
                        Week {week.weekNum}
                      </div>
                      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${week.percentage}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className="h-full gradient-primary rounded-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {week.percentage}%
                          {isTimeBasedHabit && (
                            <span className="ml-1 text-muted-foreground">
                              ({week.hours}h)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-24 text-xs text-muted-foreground shrink-0 text-right">
                        {week.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Monthly Trends */}
            <TabsContent value="monthly">
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  Monthly performance summary
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="font-medium">Completion Overview</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days in month</span>
                          <span className="font-medium">{monthlyStats.daysInMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days with progress</span>
                          <span className="font-medium">{monthlyStats.perfectDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consistency score</span>
                          <span className="font-medium text-primary">
                            {Math.round((monthlyStats.perfectDays / monthlyStats.daysInMonth) * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {(isTimeBasedHabit || selectedHabitId === 'all') && (
                    <Card className="bg-muted/30 border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-5 h-5 text-accent" />
                          <span className="font-medium">Time Investment</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total hours</span>
                            <span className="font-medium">{monthlyStats.totalHours}h</span>
                          </div>
                          {isTimeBasedHabit && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Target hours</span>
                                <span className="font-medium">{monthlyStats.targetHours}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Achievement</span>
                                <span className={cn(
                                  "font-medium",
                                  monthlyStats.totalHours >= monthlyStats.targetHours ? "text-primary" : "text-muted-foreground"
                                )}>
                                  {monthlyStats.targetHours > 0 
                                    ? `${Math.round((monthlyStats.totalHours / monthlyStats.targetHours) * 100)}%`
                                    : '-'
                                  }
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Daily average</span>
                            <span className="font-medium">
                              {(monthlyStats.totalHours / monthlyStats.daysInMonth).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
