import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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
import type { Habit } from '@/hooks/useHabits';

const ICONS = ['✓', '🏃', '📚', '💧', '🧘', '💪', '🎯', '✍️', '🌱', '💤', '🍎', '🎨'];
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

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setIcon(editingHabit.icon);
      setColor(editingHabit.color);
      setFrequency(editingHabit.frequency as 'daily' | 'weekly');
    } else {
      setName('');
      setDescription('');
      setIcon('✓');
      setColor('#10B981');
      setFrequency('daily');
    }
  }, [editingHabit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      frequency,
      target_days: [0, 1, 2, 3, 4, 5, 6],
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {editingHabit ? 'Edit Habit' : 'New Habit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Habit name</Label>
            <Input
              id="name"
              placeholder="e.g., Morning meditation"
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

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icon === i 
                      ? 'bg-primary/10 ring-2 ring-primary' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
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
