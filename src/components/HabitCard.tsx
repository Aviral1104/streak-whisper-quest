import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, MoreHorizontal, Trash2, Edit2, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Habit } from '@/hooks/useHabits';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  currentHours?: number;
  onToggle: () => void;
  onLogTime?: (hours: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  canLogTime?: boolean;
  cooldownRemaining?: number;
  maxAllowed?: number;
  blockReason?: string;
}

export default function HabitCard({ 
  habit, 
  isCompleted, 
  currentHours = 0,
  onToggle,
  onLogTime,
  onEdit, 
  onDelete,
  canLogTime = true,
  cooldownRemaining = 0,
  maxAllowed = 1,
  blockReason,
}: HabitCardProps) {
  const [isLogging, setIsLogging] = useState(false);

  const isTimeBasedHabit = habit.habit_type === 'hours';
  const targetHours = habit.target_hours_daily || 1;
  const progressPercent = isTimeBasedHabit 
    ? Math.min((currentHours / targetHours) * 100, 100) 
    : 0;
  const isTargetMet = currentHours >= targetHours;

  const handleQuickAdd = (delta: number) => {
    if (onLogTime) {
      const newHours = Math.max(0, currentHours + delta);
      onLogTime(newHours);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative p-4 rounded-2xl border transition-all duration-300",
        isTimeBasedHabit 
          ? isTargetMet 
            ? "bg-primary/5 border-primary/20"
            : "bg-card border-border hover:border-primary/30"
          : isCompleted 
            ? "bg-primary/5 border-primary/20" 
            : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Completion Button / Time Display */}
        {isTimeBasedHabit ? (
          <motion.div
            className={cn(
              "w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 shrink-0",
              isTargetMet 
                ? "gradient-primary shadow-glow" 
                : "bg-secondary border border-border"
            )}
          >
            <Clock className={cn(
              "w-4 h-4 mb-0.5",
              isTargetMet ? "text-primary-foreground" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-bold",
              isTargetMet ? "text-primary-foreground" : "text-foreground"
            )}>
              {currentHours.toFixed(1)}h
            </span>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 shrink-0",
              isCompleted 
                ? "gradient-primary shadow-glow" 
                : "bg-secondary hover:bg-primary/10 border border-border"
            )}
          >
            {isCompleted ? (
              <Check className="w-6 h-6 text-primary-foreground" />
            ) : (
              <span>{habit.icon}</span>
            )}
          </motion.button>
        )}

        {/* Habit Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={cn(
                "font-semibold text-foreground transition-colors flex items-center gap-2",
                (isTimeBasedHabit ? isTargetMet : isCompleted) && "text-primary"
              )}>
                {habit.name}
                {isTimeBasedHabit && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {targetHours}h/day
                  </span>
                )}
              </h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {habit.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Time-based progress */}
          {isTimeBasedHabit && (
            <div className="mt-3 space-y-2">
              <Progress value={progressPercent} className="h-2" />
              {cooldownRemaining > 0 ? (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                  ⏳ Cooldown: {cooldownRemaining}m remaining
                </div>
              ) : !canLogTime && blockReason ? (
                <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                  🔒 {blockReason}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(-0.5)}
                    disabled={currentHours === 0}
                    className="h-7 px-2"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(0.5)}
                    disabled={!canLogTime || 0.5 > maxAllowed}
                    className="h-7 px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    0.5h
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(1)}
                    disabled={!canLogTime || 1 > maxAllowed}
                    className="h-7 px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    1h
                  </Button>
                </div>
              )}
              {isTargetMet && (
                <span className="text-xs text-primary font-medium">
                  ✓ Target met!
                </span>
              )}
            </div>
          )}

          {/* Streak Info (for checkbox habits) */}
          {!isTimeBasedHabit && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Flame className={cn(
                  "w-4 h-4",
                  habit.current_streak > 0 ? "text-streak" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  habit.current_streak > 0 ? "text-streak" : "text-muted-foreground"
                )}>
                  {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''}
                </span>
              </div>
              {habit.longest_streak > 0 && (
                <span className="text-xs text-muted-foreground">
                  Best: {habit.longest_streak} days
                </span>
              )}
            </div>
          )}

          {/* Streak for time-based habits */}
          {isTimeBasedHabit && habit.current_streak > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Flame className="w-4 h-4 text-streak" />
              <span className="text-sm font-medium text-streak">
                {habit.current_streak} day streak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Streak Fire Effect */}
      {habit.current_streak >= 7 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-accent flex items-center justify-center shadow-soft"
        >
          <Flame className="w-4 h-4 text-accent-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}
