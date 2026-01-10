import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, getDay, isSameMonth, startOfWeek, endOfWeek, addDays, getHours, parseISO, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, Calendar, TrendingUp, Clock, Target, Lock, Sparkles, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import type { Habit, HabitCompletion } from '@/hooks/useHabits';
import type { TimeLog } from '@/hooks/useTimeLogs';

interface AnalyticsProProps {
  habits: Habit[];
  completions: HabitCompletion[];
  timeLogs: TimeLog[];
}

export default function AnalyticsPro({ habits, completions, timeLogs }: AnalyticsProProps) {
  const { hasAnalyticsPro } = usePremiumFeatures();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'heatmap' | 'hourly' | 'trends'>('heatmap');

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
        percentage: log ? Math.min((log.hours / target) * 100, 100) : 0,
      };
    }
    
    const completed = completions.some(c => c.habit_id === selectedHabitId && c.completed_at === dateStr);
    return { completed, percentage: completed ? 100 : 0 };
  };

  // Calculate hour-of-day patterns (Pro feature)
  const hourlyPatterns = useMemo(() => {
    const patterns: number[] = Array(24).fill(0);
    
    // Analyze time logs to see when activities happen
    timeLogs.forEach(log => {
      const createdAt = parseISO(log.created_at);
      const hour = getHours(createdAt);
      patterns[hour] += log.hours;
    });
    
    // Also include completions
    completions.forEach(c => {
      const createdAt = parseISO(c.created_at);
      const hour = getHours(createdAt);
      patterns[hour] += 0.5; // Weight completions as 0.5h equivalent
    });
    
    const maxValue = Math.max(...patterns, 1);
    return patterns.map(v => (v / maxValue) * 100);
  }, [timeLogs, completions]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalCompleted = 0;
    let totalPossible = 0;
    let totalHours = 0;
    let perfectDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    const sortedDays = [...monthDays].sort((a, b) => a.getTime() - b.getTime());
    
    sortedDays.forEach(day => {
      const data = getDateData(day);
      
      if (selectedHabitId === 'all') {
        totalCompleted += data.count || 0;
        totalPossible += data.total || 0;
        totalHours += data.hours || 0;
        if (data.percentage === 100 && (data.total || 0) > 0) {
          perfectDays++;
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      } else if (isTimeBasedHabit) {
        totalHours += data.hours || 0;
        if ((data.hours || 0) >= (data.target || 0)) {
          perfectDays++;
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
        totalPossible++;
      } else {
        if (data.completed) {
          totalCompleted++;
          perfectDays++;
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
        totalPossible++;
      }
    });

    currentStreak = tempStreak;

    return {
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      totalHours: Math.round(totalHours * 10) / 10,
      perfectDays,
      daysInMonth: monthDays.length,
      bestStreak: maxStreak,
      avgHoursPerDay: monthDays.length > 0 ? Math.round((totalHours / monthDays.length) * 10) / 10 : 0,
    };
  }, [selectedHabitId, monthDays, completions, timeLogs, habits]);

  // Intensity for heatmap
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

  // Locked overlay
  if (!hasAnalyticsPro) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Analytics Pro</h3>
            <p className="text-muted-foreground mb-4 max-w-xs">
              Unlock advanced analytics including hour-of-day patterns, streak analysis, and detailed breakdowns.
            </p>
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              Unlock for 2000 coins
            </Button>
          </div>
        </div>
        
        {/* Blurred preview */}
        <CardHeader className="filter blur-[2px]">
          <CardTitle>Analytics Pro</CardTitle>
        </CardHeader>
        <CardContent className="filter blur-[2px]">
          <div className="h-64 bg-muted/30 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-card border border-border rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
              Analytics Pro
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">PRO</span>
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
          {/* Pro Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              className="bg-primary/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-primary">
                {monthlyStats.completionRate}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Completion</div>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-accent/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-accent">{monthlyStats.totalHours}h</div>
              <div className="text-xs text-muted-foreground mt-1">Total Hours</div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-streak/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-streak">{monthlyStats.perfectDays}</div>
              <div className="text-xs text-muted-foreground mt-1">Perfect Days</div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-muted rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground">{monthlyStats.bestStreak}</div>
              <div className="text-xs text-muted-foreground mt-1">Best Streak</div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-secondary rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-secondary-foreground">{monthlyStats.avgHoursPerDay}h</div>
              <div className="text-xs text-muted-foreground mt-1">Avg/Day</div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground">{monthlyStats.daysInMonth}</div>
              <div className="text-xs text-muted-foreground mt-1">Days</div>
            </motion.div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="heatmap" className="gap-1 text-xs">
                <Calendar className="w-3 h-3" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="hourly" className="gap-1 text-xs">
                <Activity className="w-3 h-3" />
                Hourly
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-1 text-xs">
                <TrendingUp className="w-3 h-3" />
                Trends
              </TabsTrigger>
            </TabsList>

            {/* Heatmap View */}
            <TabsContent value="heatmap">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Monthly activity heatmap</span>
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
                        transition={{ delay: idx * 0.003 }}
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
                        
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-medium">
                          <div className="font-medium">{format(day, 'MMM d, yyyy')}</div>
                          <div className="text-muted-foreground">
                            {Math.round(data.percentage)}% complete
                            {(data as any).hours > 0 && ` • ${(data as any).hours}h logged`}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Hourly Patterns */}
            <TabsContent value="hourly">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>When are you most productive?</span>
                </div>
                
                <div className="grid grid-cols-12 gap-1 h-32">
                  {hourlyPatterns.slice(0, 24).map((value, hour) => (
                    <motion.div
                      key={hour}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(value, 5)}%` }}
                      transition={{ delay: hour * 0.02, duration: 0.5 }}
                      className={cn(
                        'rounded-t-sm self-end relative group cursor-default',
                        value > 70 ? 'bg-primary' :
                        value > 40 ? 'bg-primary/70' :
                        value > 20 ? 'bg-primary/40' : 'bg-muted'
                      )}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {hour.toString().padStart(2, '0')}:00 - {Math.round(value)}% activity
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>12 AM</span>
                </div>
              </div>
            </TabsContent>

            {/* Trends */}
            <TabsContent value="trends">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <span className="font-medium">Performance Insight</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {monthlyStats.completionRate >= 80 
                          ? "Excellent! You're crushing it this month. Keep up the great work!"
                          : monthlyStats.completionRate >= 50
                          ? "Good progress! You're on track. A little more consistency will get you to your goals."
                          : "There's room for improvement. Try focusing on one habit at a time."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-accent" />
                        <span className="font-medium">Time Investment</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You've invested <strong>{monthlyStats.totalHours} hours</strong> this month,
                        averaging <strong>{monthlyStats.avgHoursPerDay}h per day</strong>.
                        {monthlyStats.avgHoursPerDay >= 2 
                          ? " That's a solid commitment!"
                          : " Consider increasing your daily investment."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-streak" />
                      <span className="font-medium">Streak Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Best streak this month:</span>
                        <span className="ml-2 font-bold text-streak">{monthlyStats.bestStreak} days</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Perfect days:</span>
                        <span className="ml-2 font-bold text-primary">{monthlyStats.perfectDays}/{monthlyStats.daysInMonth}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
