import { motion } from 'framer-motion';
import { Check, Flame, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitCard({ 
  habit, 
  isCompleted, 
  onToggle, 
  onEdit, 
  onDelete 
}: HabitCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative p-4 rounded-2xl border transition-all duration-300",
        isCompleted 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Completion Button */}
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

        {/* Habit Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={cn(
                "font-semibold text-foreground transition-colors",
                isCompleted && "text-primary"
              )}>
                {habit.name}
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

          {/* Streak Info */}
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
