import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Link2, Bell, Palette } from 'lucide-react';
import { format, addHours, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarEvent } from '@/hooks/useEvents';
import { Habit } from '@/hooks/useHabits';

const COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', 
  '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed'>) => void;
  habits: Habit[];
  editingEvent?: CalendarEvent | null;
  defaultDate?: Date;
}

export default function EventDialog({
  open,
  onOpenChange,
  onSave,
  habits,
  editingEvent,
  defaultDate,
}: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [linkedHabitId, setLinkedHabitId] = useState<string>('none');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);

  const hourBasedHabits = habits.filter(h => h.habit_type === 'hours');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setStartTime(format(parseISO(editingEvent.start_time), "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(parseISO(editingEvent.end_time), "yyyy-MM-dd'T'HH:mm"));
      setColor(editingEvent.color);
      setLinkedHabitId(editingEvent.linked_habit_id || 'none');
      setReminderEnabled(!!editingEvent.reminder_minutes);
      setReminderMinutes(editingEvent.reminder_minutes || 15);
    } else {
      const baseDate = defaultDate || new Date();
      const start = new Date(baseDate);
      start.setHours(9, 0, 0, 0);
      
      setTitle('');
      setDescription('');
      setStartTime(format(start, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(addHours(start, 1), "yyyy-MM-dd'T'HH:mm"));
      setColor('#3B82F6');
      setLinkedHabitId('none');
      setReminderEnabled(false);
      setReminderMinutes(15);
    }
  }, [editingEvent, defaultDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      color,
      linked_habit_id: linkedHabitId === 'none' ? null : linkedHabitId,
      reminder_minutes: reminderEnabled ? reminderMinutes : null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {editingEvent ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event title</Label>
            <Input
              id="title"
              placeholder="e.g., Study session, Team meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Start
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Color
            </Label>
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

          {hourBasedHabits.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linked-habit" className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Link to habit (optional)
              </Label>
              <Select value={linkedHabitId} onValueChange={setLinkedHabitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a habit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked habit</SelectItem>
                  {hourBasedHabits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      {habit.icon} {habit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Hours from this event will be logged to the linked habit when completed
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="reminder" className="text-sm cursor-pointer">
                Reminder
              </Label>
            </div>
            <Switch
              id="reminder"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {reminderEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Select value={reminderMinutes.toString()} onValueChange={(v) => setReminderMinutes(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}

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
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
