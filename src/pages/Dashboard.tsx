import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Target, Flame, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import Header from '@/components/Header';
import HabitCard from '@/components/HabitCard';
import AddHabitDialog from '@/components/AddHabitDialog';
import StatsCard from '@/components/StatsCard';
import ProgressChart from '@/components/ProgressChart';
import WeekView from '@/components/WeekView';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useHabits, Habit } from '@/hooks/useHabits';
import { useTimeLogs } from '@/hooks/useTimeLogs';
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

  const today = format(new Date(), 'yyyy-MM-dd');

  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');
  const timeBasedHabits = habits.filter(h => h.habit_type === 'hours');

  const stats = useMemo(() => {
    // Checkbox habits stats
    const todayCompletions = completions.filter(c => c.completed_at === today).length;
    const totalStreak = checkboxHabits.reduce((sum, h) => sum + h.current_streak, 0);
    const longestStreak = Math.max(...habits.map(h => h.longest_streak), 0);
    const checkboxRate = checkboxHabits.length > 0 
      ? Math.round((todayCompletions / checkboxHabits.length) * 100) 
      : 0;

    // Time-based habits stats
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
    toggleCompletion.mutate({ habitId, date });
  };

  const handleLogTime = (habitId: string, hours: number) => {
    logTime.mutate({ habitId, hours, date: today });
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
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">
            {format(new Date(), 'EEEE, MMMM d')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {habits.length > 0 
              ? `You've completed ${stats.todayCompletions} of ${habits.length} habits today` 
              : 'Start building habits that last'}
          </p>
        </motion.div>

        {habits.length === 0 ? (
          <EmptyState onCreateHabit={() => setIsAddOpen(true)} />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            {/* Today's Habits */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Today's Habits</h2>
                <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Habit
                </Button>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {habits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      isCompleted={isCompletedToday(habit.id)}
                      currentHours={habit.habit_type === 'hours' ? getHoursForDate(habit.id, today) : 0}
                      onToggle={() => handleToggle(habit.id)}
                      onLogTime={habit.habit_type === 'hours' ? (hours) => handleLogTime(habit.id, hours) : undefined}
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

            {/* Week View */}
            <WeekView 
              habits={habits} 
              completions={completions} 
              onToggle={handleToggle}
            />

            {/* Progress Chart */}
            <div className="mt-8">
              <ProgressChart habits={habits} completions={completions} />
            </div>
          </>
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
