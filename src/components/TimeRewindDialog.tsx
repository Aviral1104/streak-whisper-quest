import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { RotateCcw, Calendar, Check, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useHabits, Habit, HabitCompletion } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';

interface TimeRewindDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  completions: HabitCompletion[];
  onRewind: (habitId: string, date: string, action: 'add' | 'remove') => Promise<void>;
  hasTimeRewind: boolean;
  onConsume: () => Promise<void>;
}

export default function TimeRewindDialog({ 
  open, 
  onOpenChange, 
  habits,
  completions,
  onRewind,
  hasTimeRewind,
  onConsume
}: TimeRewindDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [isProcessing, setIsProcessing] = useState(false);

  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);
  
  // Generate last 7 days (excluding today)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i + 1);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE, MMM d'),
    };
  });

  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');

  const isCompletedOnDate = (habitId: string, date: string) => {
    return completions.some(c => c.habit_id === habitId && c.completed_at === date);
  };

  const selectedHabitObj = checkboxHabits.find(h => h.id === selectedHabit);
  const isCurrentlyCompleted = selectedDate && selectedHabit 
    ? isCompletedOnDate(selectedHabit, selectedDate) 
    : false;

  const handleConfirm = async () => {
    if (!selectedDate || !selectedHabit || !hasTimeRewind) return;

    setIsProcessing(true);
    try {
      await onRewind(selectedHabit, selectedDate, isCurrentlyCompleted ? 'remove' : 'add');
      await onConsume();
      toast.success('Your habit history has been updated.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update habit history');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasTimeRewind) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Time Rewind Locked</h3>
            <p className="text-muted-foreground mb-4">
              Purchase Time Rewind from the Shop to edit past completions.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Time Rewind
          </DialogTitle>
          <DialogDescription>
            Edit one habit completion from the last 7 days. This is a single-use feature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a date" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {date.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Habit Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Habit</label>
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a habit" />
              </SelectTrigger>
              <SelectContent>
                {checkboxHabits.map((habit) => {
                  const isComplete = selectedDate ? isCompletedOnDate(habit.id, selectedDate) : false;
                  return (
                    <SelectItem key={habit.id} value={habit.id}>
                      <div className="flex items-center gap-2">
                        <span>{habit.icon}</span>
                        <span>{habit.name}</span>
                        {selectedDate && (
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            isComplete ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? 'Completed' : 'Missed'}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedDate && selectedHabit && selectedHabitObj && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${selectedHabitObj.color}20`, color: selectedHabitObj.color }}
                >
                  {selectedHabitObj.icon}
                </div>
                <div>
                  <div className="font-medium">{selectedHabitObj.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedDate), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">
                  This will {isCurrentlyCompleted ? 'remove' : 'add'} the completion and may affect your streak.
                </span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 gap-2"
            disabled={!selectedDate || !selectedHabit || isProcessing}
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Rewind
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
