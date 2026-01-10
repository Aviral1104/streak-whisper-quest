import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CustomIconPicker from '@/components/CustomIconPicker';
import type { Habit } from '@/hooks/useHabits';

const STANDARD_ICONS = ['✓', '🏃', '📚', '💧', '🧘', '💪', '🎯', '✍️', '🌱', '💤', '🍎', '🎨'];
const COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
  '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'
];

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_streak' | 'longest_streak' | 'is_archived'>) => void;
  editingHabit?: Habit | null;
}

export default function AddHabitDialog({ 
  open, 
  onOpenChange, 
  onSave,
  editingHabit 
}: AddHabitDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✓');
  const [color, setColor] = useState('#10B981');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitType, setHabitType] = useState<'checkbox' | 'hours'>('checkbox');
  const [targetHoursDaily, setTargetHoursDaily] = useState('1');
  const [targetHoursWeekly, setTargetHoursWeekly] = useState('10');

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setIcon(editingHabit.custom_icon || editingHabit.icon || '✓');
      setColor(editingHabit.color || '#10B981');
      setFrequency(editingHabit.frequency as 'daily' | 'weekly');
      setHabitType(editingHabit.habit_type as 'checkbox' | 'hours' || 'checkbox');
      setTargetHoursDaily(editingHabit.target_hours_daily?.toString() || '1');
      setTargetHoursWeekly(editingHabit.target_hours_weekly?.toString() || '10');
    } else {
      setName('');
      setDescription('');
      setIcon('✓');
      setColor('#10B981');
      setFrequency('daily');
      setHabitType('checkbox');
      setTargetHoursDaily('1');
      setTargetHoursWeekly('10');
    }
  }, [editingHabit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Determine if it's a custom icon (not in standard icons)
    const isCustomIcon = !STANDARD_ICONS.includes(icon);
    
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      icon: isCustomIcon ? STANDARD_ICONS[0] : icon,
      custom_icon: isCustomIcon ? icon : null,
      color,
      frequency,
      target_days: [0, 1, 2, 3, 4, 5, 6],
      habit_type: habitType,
      target_hours_daily: habitType === 'hours' ? parseFloat(targetHoursDaily) || 1 : null,
      target_hours_weekly: habitType === 'hours' ? parseFloat(targetHoursWeekly) || 10 : null,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {editingHabit ? 'Edit Habit' : 'New Habit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Habit Type Selector */}
          <div className="space-y-2">
            <Label>Habit type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHabitType('checkbox')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  habitType === 'checkbox'
                    ? 'border-primary bg-primary/5 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CheckSquare className={`w-6 h-6 ${habitType === 'checkbox' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Checkbox</span>
                <span className="text-xs text-muted-foreground text-center">Simple daily completion</span>
              </button>
              <button
                type="button"
                onClick={() => setHabitType('hours')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  habitType === 'hours'
                    ? 'border-primary bg-primary/5 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Clock className={`w-6 h-6 ${habitType === 'hours' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Time-based</span>
                <span className="text-xs text-muted-foreground text-center">Track hours spent</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Habit name</Label>
            <Input
              id="name"
              placeholder={habitType === 'hours' ? 'e.g., Study DSA, Practice piano' : 'e.g., Morning meditation'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Why is this habit important to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Hour targets for time-based habits */}
          <AnimatePresence>
            {habitType === 'hours' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Time Targets
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="daily-hours">Daily target (hours)</Label>
                      <Input
                        id="daily-hours"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={targetHoursDaily}
                        onChange={(e) => setTargetHoursDaily(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekly-hours">Weekly target (hours)</Label>
                      <Input
                        id="weekly-hours"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={targetHoursWeekly}
                        onChange={(e) => setTargetHoursWeekly(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label>Icon</Label>
            <CustomIconPicker
              selectedIcon={icon}
              onSelectIcon={setIcon}
              standardIcons={STANDARD_ICONS}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    frequency === f 
                      ? 'gradient-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
