import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Target,
  Table2,
  Check,
  X
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Tracker() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { habits, completions, toggleCompletion, isLoading } = useHabits();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isCompleted = (habitId: string, date: string) => {
    return completions.some(c => c.habit_id === habitId && c.completed_at === date);
  };

  const getDayCompletionRate = (date: string) => {
    if (habits.length === 0) return 0;
    const dayCompletions = completions.filter(c => c.completed_at === date);
    return (dayCompletions.length / habits.length) * 100;
  };

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
    const headers = ['Date', ...habits.map(h => h.name)];
    const rows = monthDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const displayDate = format(day, 'MMM dd, yyyy');
      const habitStatuses = habits.map(h => isCompleted(h.id, dateStr) ? '✓' : '✗');
      return [displayDate, ...habitStatuses];
    });

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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Table2 className="w-8 h-8 text-primary" />
                Habit Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your progress with detailed views
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="gap-2 ml-2" onClick={downloadExcel}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{monthlyStats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Monthly Completion</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{monthlyStats.totalCompleted}</div>
              <div className="text-sm text-muted-foreground">Habits Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-amber-500">{monthlyStats.perfectDays}</div>
              <div className="text-sm text-muted-foreground">Perfect Days</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="spreadsheet" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="spreadsheet" className="gap-2">
              <Table2 className="w-4 h-4" />
              Spreadsheet
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="w-4 h-4" />
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Spreadsheet View */}
          <TabsContent value="spreadsheet">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 z-10">Date</th>
                      {habits.map(habit => (
                        <th key={habit.id} className="p-3 text-center font-semibold min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">{habit.icon}</span>
                            <span className="text-xs truncate max-w-[80px]">{habit.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthDays.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const dayOfWeek = format(day, 'EEE');
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      const isTodayDate = isToday(day);
                      
                      return (
                        <motion.tr
                          key={dateStr}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.01 }}
                          className={cn(
                            'border-b transition-colors',
                            isWeekend && 'bg-muted/30',
                            isTodayDate && 'bg-primary/10 border-primary/30'
                          )}
                        >
                          <td className={cn(
                            'p-3 sticky left-0 z-10',
                            isWeekend ? 'bg-muted/30' : 'bg-background',
                            isTodayDate && 'bg-primary/10'
                          )}>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-xs font-medium',
                                isWeekend && 'text-muted-foreground'
                              )}>
                                {dayOfWeek}
                              </span>
                              <span className={cn(
                                'font-medium',
                                isTodayDate && 'text-primary font-bold'
                              )}>
                                {format(day, 'd')}
                              </span>
                            </div>
                          </td>
                          {habits.map(habit => {
                            const completed = isCompleted(habit.id, dateStr);
                            return (
                              <td key={habit.id} className="p-3 text-center">
                                <button
                                  onClick={() => handleToggle(habit.id, dateStr)}
                                  className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                    completed 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted hover:bg-muted/80'
                                  )}
                                >
                                  {completed ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <X className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <Card>
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
                        transition={{ delay: idx * 0.01 }}
                        className={cn(
                          'aspect-square p-2 rounded-lg relative flex flex-col items-center justify-center gap-1',
                          !inMonth && 'opacity-30',
                          isTodayDate && 'ring-2 ring-primary',
                          completionRate === 100 && inMonth && 'bg-primary/20',
                          completionRate > 0 && completionRate < 100 && inMonth && 'bg-primary/10'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          isTodayDate && 'text-primary font-bold'
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
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="text-2xl">{habit.icon}</span>
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
                            <span>Streak: {habit.current_streak} days</span>
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
  );
}