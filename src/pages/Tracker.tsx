import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  isPast,
  isFuture,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  parseISO,
  differenceInDays,
  isSameDay
} from 'date-fns';
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Target,
  Table2,
  Check,
  Lock,
  BookOpen,
  TrendingUp,
  Flame,
  BarChart3,
  Sparkles,
  PenLine
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Tracker() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [journalNotes, setJournalNotes] = useState<Record<string, string>>({});
  const { habits, completions, toggleCompletion, isLoading } = useHabits();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load journal notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('habit-journal-notes');
    if (saved) {
      setJournalNotes(JSON.parse(saved));
    }
  }, []);

  const saveJournalNote = (key: string, value: string) => {
    const updated = { ...journalNotes, [key]: value };
    setJournalNotes(updated);
    localStorage.setItem('habit-journal-notes', JSON.stringify(updated));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get weeks for the month
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];
    
    monthDays.forEach((day, idx) => {
      currentWeek.push(day);
      if (getDay(day) === 6 || idx === monthDays.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return result;
  }, [monthDays]);

  const currentWeekDays = weeks[selectedWeek] || weeks[0] || [];

  const isCompleted = (habitId: string, date: string) => {
    return completions.some(c => c.habit_id === habitId && c.completed_at === date);
  };

  const getDayCompletionRate = (date: string) => {
    if (habits.length === 0) return 0;
    const dayCompletions = completions.filter(c => c.completed_at === date);
    return (dayCompletions.length / habits.length) * 100;
  };

  const canToggle = (date: Date) => {
    return isToday(date);
  };

  // Weekly stats
  const weeklyStats = useMemo(() => {
    if (!currentWeekDays.length) return { total: 0, completed: 0, percentage: 0, streakChanges: 0 };
    
    const totalPossible = habits.length * currentWeekDays.length;
    const totalCompleted = currentWeekDays.reduce((sum, day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return sum + completions.filter(c => c.completed_at === dateStr).length;
    }, 0);
    
    // Calculate habit consistency
    const habitConsistency = habits.map(habit => {
      const weekCompletions = currentWeekDays.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return isCompleted(habit.id, dateStr);
      }).length;
      return {
        name: habit.name,
        icon: habit.icon,
        completed: weekCompletions,
        total: currentWeekDays.length,
        percentage: Math.round((weekCompletions / currentWeekDays.length) * 100)
      };
    });

    return {
      total: totalPossible,
      completed: totalCompleted,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      habitConsistency,
      perfectDays: currentWeekDays.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayCompletions = completions.filter(c => c.completed_at === dateStr);
        return dayCompletions.length === habits.length && habits.length > 0;
      }).length
    };
  }, [habits, completions, currentWeekDays]);

  const monthlyStats = useMemo(() => {
    const totalPossible = habits.length * monthDays.length;
    const totalCompleted = monthDays.reduce((sum, day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return sum + completions.filter(c => c.completed_at === dateStr).length;
    }, 0);
    
    const perfectDays = monthDays.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayCompletions = completions.filter(c => c.completed_at === dateStr);
      return dayCompletions.length === habits.length && habits.length > 0;
    }).length;

    return {
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      totalCompleted,
      perfectDays,
    };
  }, [habits, completions, monthDays]);

  const handleToggle = (habitId: string, date: string) => {
    toggleCompletion.mutate({ habitId, date });
  };

  const downloadExcel = () => {
    const headers = ['Date', 'Day', ...habits.map(h => h.name), 'Completion %'];
    const rows = monthDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const displayDate = format(day, 'MMM dd, yyyy');
      const dayName = format(day, 'EEEE');
      const habitStatuses = habits.map(h => isCompleted(h.id, dateStr) ? '✓' : '');
      const completionRate = getDayCompletionRate(dateStr);
      return [displayDate, dayName, ...habitStatuses, `${Math.round(completionRate)}%`];
    });

    // Add summary row
    rows.push([]);
    rows.push(['Summary', '', ...habits.map(() => ''), '']);
    rows.push(['Total Completed', '', String(monthlyStats.totalCompleted), '', '', '']);
    rows.push(['Completion Rate', '', `${monthlyStats.completionRate}%`, '', '', '']);
    rows.push(['Perfect Days', '', String(monthlyStats.perfectDays), '', '', '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `habits-${format(currentMonth, 'yyyy-MM')}.csv`;
    link.click();
  };

  if (loading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const weekKey = `week-${format(currentMonth, 'yyyy-MM')}-${selectedWeek}`;

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pastel-cream/50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-journal-accent" />
                  </div>
                  Habit Journal
                </h1>
                <p className="text-muted-foreground mt-1">
                  Your personal tracking companion
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold min-w-[140px] text-center px-4 py-2 bg-card rounded-xl shadow-soft">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="gap-2 ml-2 rounded-xl" onClick={downloadExcel}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Week Selector Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weeks.map((week, idx) => (
                <Button
                  key={idx}
                  variant={selectedWeek === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(idx)}
                  className={cn(
                    "rounded-full px-4 whitespace-nowrap transition-all",
                    selectedWeek === idx && "shadow-glow"
                  )}
                >
                  Week {idx + 1}
                  <span className="ml-1 text-xs opacity-70">
                    ({format(week[0], 'MMM d')} - {format(week[week.length - 1], 'd')})
                  </span>
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Main Spreadsheet Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="paper-texture overflow-hidden rounded-2xl shadow-medium border-journal-line/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="spreadsheet-header spreadsheet-cell sticky left-0 z-20 bg-journal-warm min-w-[180px] p-4 text-left">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-journal-accent" />
                            Habits
                          </div>
                        </th>
                        {currentWeekDays.map((day, idx) => {
                          const isTodayDate = isToday(day);
                          const dayStr = format(day, 'EEE');
                          const dateNum = format(day, 'd');
                          
                          return (
                            <th 
                              key={idx} 
                              className={cn(
                                "spreadsheet-header spreadsheet-cell min-w-[80px] p-3 text-center",
                                isTodayDate && "bg-primary/10 ring-2 ring-primary ring-inset"
                              )}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground">{dayStr}</span>
                                <span className={cn(
                                  "text-lg font-semibold",
                                  isTodayDate && "text-primary"
                                )}>
                                  {dateNum}
                                </span>
                                {isTodayDate && (
                                  <span className="text-[10px] text-primary font-medium">Today</span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                        <th className="spreadsheet-header spreadsheet-cell min-w-[90px] p-3 text-center bg-pastel-sage/20">
                          <div className="flex flex-col items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <span className="text-xs">Weekly</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {habits.map((habit, habitIdx) => {
                        const weekCompletions = currentWeekDays.filter(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          return isCompleted(habit.id, dateStr);
                        }).length;
                        const weekPercentage = Math.round((weekCompletions / currentWeekDays.length) * 100);
                        
                        return (
                          <motion.tr
                            key={habit.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: habitIdx * 0.05 }}
                            className="group"
                          >
                            <td className="spreadsheet-cell sticky left-0 z-10 bg-card p-4 border-r-2 border-journal-line/30">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-soft transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                                >
                                  {habit.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{habit.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-streak" />
                                    {habit.current_streak} streak
                                  </div>
                                </div>
                              </div>
                            </td>
                            {currentWeekDays.map((day, dayIdx) => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const completed = isCompleted(habit.id, dateStr);
                              const isTodayDate = isToday(day);
                              const isLocked = !canToggle(day);
                              const isPastDay = isPast(day) && !isTodayDate;
                              const isFutureDay = isFuture(day);
                              
                              return (
                                <td 
                                  key={dayIdx} 
                                  className={cn(
                                    "spreadsheet-cell p-2 text-center",
                                    isTodayDate && "bg-primary/5",
                                    isPastDay && "bg-muted/30",
                                    isFutureDay && "bg-muted/20"
                                  )}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => !isLocked && handleToggle(habit.id, dateStr)}
                                        disabled={isLocked}
                                        className={cn(
                                          "w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all relative",
                                          !isLocked && "hover:scale-110 active:scale-95",
                                          completed && !isLocked && "bg-primary shadow-glow",
                                          completed && isLocked && isPastDay && "bg-primary/60",
                                          !completed && !isLocked && "bg-muted/50 hover:bg-muted border-2 border-dashed border-muted-foreground/20",
                                          !completed && isLocked && "bg-muted/30",
                                          isLocked && "cursor-not-allowed opacity-70"
                                        )}
                                      >
                                        <AnimatePresence mode="wait">
                                          {completed ? (
                                            <motion.div
                                              key="check"
                                              initial={{ scale: 0, rotate: -180 }}
                                              animate={{ scale: 1, rotate: 0 }}
                                              exit={{ scale: 0, rotate: 180 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            >
                                              <Check className={cn(
                                                "w-5 h-5",
                                                isLocked ? "text-primary-foreground/70" : "text-primary-foreground"
                                              )} />
                                            </motion.div>
                                          ) : isLocked ? (
                                            <motion.div
                                              key="lock"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                            >
                                              <Lock className="w-3 h-3 text-muted-foreground/50" />
                                            </motion.div>
                                          ) : null}
                                        </AnimatePresence>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      className="bg-card border shadow-medium rounded-lg px-3 py-2"
                                    >
                                      {isTodayDate ? (
                                        <span className="text-sm">
                                          {completed ? "Completed! Click to undo" : "Click to mark complete"}
                                        </span>
                                      ) : isPastDay ? (
                                        <span className="text-sm text-muted-foreground">
                                          {completed ? "Completed" : "Missed"} • Past days are locked
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">
                                          Future days are locked
                                        </span>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </td>
                              );
                            })}
                            <td className="spreadsheet-cell p-3 text-center bg-pastel-sage/10">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${weekPercentage}%` }}
                                    transition={{ duration: 0.5, delay: habitIdx * 0.05 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: habit.color }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{weekPercentage}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Summary & Journal Section */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="paper-texture rounded-2xl shadow-medium overflow-hidden">
                <CardHeader className="border-b border-journal-line/30 bg-pastel-cream/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Week {selectedWeek + 1} Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-pastel-sage/20 rounded-xl">
                      <div className="text-3xl font-bold text-primary">{weeklyStats.percentage}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Completion Rate</div>
                    </div>
                    <div className="text-center p-4 bg-pastel-peach/20 rounded-xl">
                      <div className="text-3xl font-bold text-accent">{weeklyStats.completed}</div>
                      <div className="text-xs text-muted-foreground mt-1">Habits Done</div>
                    </div>
                    <div className="text-center p-4 bg-pastel-lavender/20 rounded-xl">
                      <div className="text-3xl font-bold text-streak">{weeklyStats.perfectDays}</div>
                      <div className="text-xs text-muted-foreground mt-1">Perfect Days</div>
                    </div>
                  </div>

                  {/* Habit Consistency Bars */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Habit Consistency</h4>
                    {weeklyStats.habitConsistency?.map((habit, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-lg w-8">{habit.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium truncate max-w-[120px]">{habit.name}</span>
                            <span className="text-muted-foreground">{habit.completed}/{habit.total}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${habit.percentage}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.1 }}
                              className={cn(
                                "h-full rounded-full",
                                habit.percentage === 100 ? "bg-primary" : 
                                habit.percentage >= 70 ? "bg-pastel-sage" :
                                habit.percentage >= 40 ? "bg-pastel-peach" : "bg-muted-foreground/30"
                              )}
                            />
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold min-w-[40px] text-right",
                          habit.percentage === 100 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {habit.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Journal Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="journal-paper rounded-2xl shadow-medium h-full">
                <CardHeader className="border-b border-journal-line/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PenLine className="w-5 h-5 text-journal-accent" />
                    Weekly Reflections
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    placeholder="How did this week go? What worked well? Any challenges?

✨ Wins:

💭 Thoughts:

🎯 Focus for next week:"
                    value={journalNotes[weekKey] || ''}
                    onChange={(e) => saveJournalNote(weekKey, e.target.value)}
                    className="min-h-[200px] resize-none bg-transparent border-none focus-visible:ring-0 text-sm leading-relaxed placeholder:text-muted-foreground/50"
                  />
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    Auto-saved locally
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Tabs: Calendar & Goals */}
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 rounded-xl p-1 bg-muted/50">
              <TabsTrigger value="calendar" className="gap-2 rounded-lg">
                <CalendarIcon className="w-4 h-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2 rounded-lg">
                <Target className="w-4 h-4" />
                Monthly Goals
              </TabsTrigger>
            </TabsList>

            {/* Calendar View */}
            <TabsContent value="calendar">
              <Card className="paper-texture rounded-2xl shadow-medium">
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const completionRate = getDayCompletionRate(dateStr);
                      const inMonth = isSameMonth(day, currentMonth);
                      const isTodayDate = isToday(day);
                      
                      return (
                        <motion.div
                          key={dateStr}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.008 }}
                          className={cn(
                            "aspect-square p-2 rounded-xl relative flex flex-col items-center justify-center gap-1 transition-all",
                            !inMonth && "opacity-30",
                            isTodayDate && "ring-2 ring-primary shadow-glow",
                            completionRate === 100 && inMonth && "bg-primary/20",
                            completionRate > 0 && completionRate < 100 && inMonth && "bg-primary/10",
                            inMonth && completionRate === 0 && "bg-muted/30"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-medium",
                            isTodayDate && "text-primary font-bold"
                          )}>
                            {format(day, 'd')}
                          </span>
                          {inMonth && habits.length > 0 && (
                            <div className="flex gap-0.5">
                              {completionRate === 100 && <span className="text-xs">🔥</span>}
                              {completionRate > 0 && completionRate < 100 && (
                                <span className="text-[10px] text-muted-foreground">{Math.round(completionRate)}%</span>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals View */}
            <TabsContent value="goals">
              <div className="grid gap-4 md:grid-cols-2">
                {habits.map((habit) => {
                  const habitCompletions = completions.filter(c => c.habit_id === habit.id);
                  const monthlyCompletions = habitCompletions.filter(c => {
                    const date = parseISO(c.completed_at);
                    return isSameMonth(date, currentMonth);
                  }).length;
                  const target = monthDays.length;
                  const progress = (monthlyCompletions / target) * 100;

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="paper-texture rounded-2xl shadow-soft overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${habit.color}20` }}
                            >
                              {habit.icon}
                            </div>
                            {habit.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Monthly Progress</span>
                              <span className="font-semibold">{monthlyCompletions}/{target} days</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: habit.color }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{Math.round(progress)}% complete</span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-streak" />
                                {habit.current_streak} day streak
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}
