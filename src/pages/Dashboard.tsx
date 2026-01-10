import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Target, Flame, CheckCircle2, Clock, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import HabitCard from '@/components/HabitCard';
import AddHabitDialog from '@/components/AddHabitDialog';
import StatsCard from '@/components/StatsCard';
import HabitAnalytics from '@/components/HabitAnalytics';
import WeekView from '@/components/WeekView';
import CircularClock from '@/components/CircularClock';
import DigitalClock from '@/components/DigitalClock';
import WeeklyTimetable from '@/components/WeeklyTimetable';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHabits, Habit } from '@/hooks/useHabits';
import { useTimeLogs } from '@/hooks/useTimeLogs';
import { useNativeClock } from '@/hooks/useNativeClock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [lastLogTimestamp, setLastLogTimestamp] = useState<number>(0);
  
  const { 
    habits, 
    completions, 
    isLoading, 
    createHabit, 
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompletedToday 
  } = useHabits();

  const { timeLogs, logTime, getHoursForDate, getTotalHoursForWeek } = useTimeLogs();
  const { clockState, startCooldown, getCooldownForHabit, canLogTime, DEFAULT_DAILY_CAP } = useNativeClock();

  const today = format(new Date(), 'yyyy-MM-dd');

  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');
  const timeBasedHabits = habits.filter(h => h.habit_type === 'hours');

  const stats = useMemo(() => {
    const todayCompletions = completions.filter(c => c.completed_at === today).length;
    const totalStreak = checkboxHabits.reduce((sum, h) => sum + h.current_streak, 0);
    const longestStreak = Math.max(...habits.map(h => h.longest_streak), 0);
    const checkboxRate = checkboxHabits.length > 0 
      ? Math.round((todayCompletions / checkboxHabits.length) * 100) 
      : 0;

    const todayHoursLogged = timeBasedHabits.reduce((sum, h) => {
      return sum + getHoursForDate(h.id, today);
    }, 0);
    const weeklyHoursLogged = timeBasedHabits.reduce((sum, h) => {
      return sum + getTotalHoursForWeek(h.id);
    }, 0);

    return { 
      todayCompletions, 
      totalStreak, 
      longestStreak, 
      completionRate: checkboxRate,
      todayHoursLogged,
      weeklyHoursLogged,
    };
  }, [habits, completions, today, checkboxHabits, timeBasedHabits, getHoursForDate, getTotalHoursForWeek]);

  const handleSaveHabit = (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_streak' | 'longest_streak' | 'is_archived'>) => {
    if (editingHabit) {
      updateHabit.mutate({ id: editingHabit.id, ...habit });
    } else {
      createHabit.mutate(habit);
    }
    setEditingHabit(null);
  };

  const handleToggle = (habitId: string, date: string = today) => {
    if (date !== today) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.habit_type === 'hours') return;
    toggleCompletion.mutate({ habitId, date });
  };

  const handleLogTime = (habitId: string, hours: number) => {
    const currentHours = getHoursForDate(habitId, today);
    const { canLog, reason } = canLogTime(habitId, currentHours, DEFAULT_DAILY_CAP);
    
    if (!canLog) {
      return;
    }
    
    logTime.mutate({ habitId, hours, date: today });
    startCooldown(habitId);
    setLastLogTimestamp(Date.now()); // Trigger clock animation
  };

  const handleDeleteConfirm = () => {
    if (deletingHabit) {
      deleteHabit.mutate(deletingHabit.id);
      setDeletingHabit(null);
    }
  };

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
        {habits.length === 0 ? (
          <EmptyState onCreateHabit={() => setIsAddOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            {/* Main content */}
            <div className="space-y-8">
              {/* Welcome Section with Digital Clock */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {habits.length > 0 
                      ? `You've completed ${stats.todayCompletions} of ${checkboxHabits.length} habits today` 
                      : 'Start building habits that last'}
                  </p>
                </div>
                
                {/* Visible Digital Clock on Mobile/Tablet */}
                <div className="lg:hidden">
                  <DigitalClock 
                    clockState={clockState} 
                    size="sm" 
                    showSeconds={true}
                    showDate={false}
                    variant="card"
                  />
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Today's Progress"
                  value={`${stats.completionRate}%`}
                  subtitle={`${stats.todayCompletions}/${checkboxHabits.length} habits`}
                  icon={CheckCircle2}
                  variant="primary"
                  delay={0}
                />
                <StatsCard
                  title="Hours Today"
                  value={stats.todayHoursLogged.toFixed(1)}
                  subtitle={`${stats.weeklyHoursLogged.toFixed(1)}h this week`}
                  icon={Clock}
                  variant="accent"
                  delay={0.1}
                />
                <StatsCard
                  title="Current Streaks"
                  value={stats.totalStreak}
                  subtitle="Total days"
                  icon={Flame}
                  variant="streak"
                  delay={0.2}
                />
                <StatsCard
                  title="Active Habits"
                  value={habits.length}
                  subtitle={`${checkboxHabits.length} checkbox, ${timeBasedHabits.length} timed`}
                  icon={Target}
                  delay={0.3}
                />
              </div>

              {/* Tabs for different views */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="today" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="timetable" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Timetable
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <Target className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-6">
                  {/* Today's Habits */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-foreground">Today's Habits</h2>
                      <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Habit
                      </Button>
                    </div>
                    
                    {/* Checkbox Habits Section */}
                    {checkboxHabits.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Check-off Habits
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <AnimatePresence mode="popLayout">
                            {checkboxHabits.map((habit) => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                isCompleted={isCompletedToday(habit.id)}
                                onToggle={() => handleToggle(habit.id)}
                                onEdit={() => {
                                  setEditingHabit(habit);
                                  setIsAddOpen(true);
                                }}
                                onDelete={() => setDeletingHabit(habit)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Time-based Habits Section */}
                    {timeBasedHabits.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Time-Tracked Habits
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <AnimatePresence mode="popLayout">
                            {timeBasedHabits.map((habit) => {
                              const currentHours = getHoursForDate(habit.id, today);
                              const cooldown = getCooldownForHabit(habit.id);
                              const { canLog, reason, cooldownRemaining, maxAllowed } = canLogTime(
                                habit.id, 
                                currentHours,
                                habit.target_hours_daily || DEFAULT_DAILY_CAP
                              );
                              
                              return (
                                <HabitCard
                                  key={habit.id}
                                  habit={habit}
                                  isCompleted={false}
                                  currentHours={currentHours}
                                  onToggle={() => {}}
                                  onLogTime={(hours) => handleLogTime(habit.id, hours)}
                                  onEdit={() => {
                                    setEditingHabit(habit);
                                    setIsAddOpen(true);
                                  }}
                                  onDelete={() => setDeletingHabit(habit)}
                                  canLogTime={canLog}
                                  cooldownRemaining={cooldownRemaining}
                                  maxAllowed={maxAllowed}
                                  blockReason={reason}
                                />
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Week View */}
                  <WeekView 
                    habits={checkboxHabits} 
                    completions={completions} 
                    timeLogs={timeLogs}
                    onToggle={handleToggle}
                  />
                </TabsContent>

                <TabsContent value="timetable">
                  <WeeklyTimetable
                    habits={habits}
                    completions={completions}
                    timeLogs={timeLogs}
                    clockState={clockState}
                  />
                </TabsContent>

                <TabsContent value="analytics">
                  <HabitAnalytics habits={habits} completions={completions} timeLogs={timeLogs} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar with Clock */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Circular Clock */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <CircularClock
                    clockState={clockState}
                    timeLogs={timeLogs}
                    size="md"
                    showDate={true}
                    lastLogTimestamp={lastLogTimestamp}
                  />
                </motion.div>

                {/* Current Hour Info */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Current Hour</div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {String(clockState.currentHourSegment).padStart(2, '0')}:00 - {String(clockState.currentHourSegment + 1).padStart(2, '0')}:00
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {Math.round((1 - (clockState.minutes / 60)) * 60)} minutes remaining
                    </div>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-3"
                >
                  <h4 className="font-medium text-foreground">Time Budget</h4>
                  {timeBasedHabits.slice(0, 3).map(habit => {
                    const current = getHoursForDate(habit.id, today);
                    const target = habit.target_hours_daily || DEFAULT_DAILY_CAP;
                    const percent = Math.min((current / target) * 100, 100);
                    
                    return (
                      <div key={habit.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{habit.icon}</span>
                            <span className="truncate">{habit.name}</span>
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {current.toFixed(1)}/{target}h
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <AddHabitDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingHabit} onOpenChange={() => setDeletingHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingHabit?.name}" and all its completion history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
