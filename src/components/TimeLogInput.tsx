import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TimeLogInputProps {
  habitId: string;
  currentHours: number;
  targetHours: number;
  onLogTime: (hours: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function TimeLogInput({
  habitId,
  currentHours,
  targetHours,
  onLogTime,
  disabled = false,
  compact = false,
}: TimeLogInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentHours.toString());

  const progressPercent = targetHours > 0 ? Math.min((currentHours / targetHours) * 100, 100) : 0;
  const isComplete = currentHours >= targetHours;

  const handleQuickAdd = (hours: number) => {
    const newTotal = Math.max(0, currentHours + hours);
    onLogTime(newTotal);
  };

  const handleSubmit = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0) {
      onLogTime(value);
    }
    setIsEditing(false);
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !disabled && handleQuickAdd(0.5)}
            disabled={disabled}
            className={cn(
              "w-10 h-10 mx-auto rounded-xl flex flex-col items-center justify-center transition-all text-xs relative overflow-hidden",
              !disabled && "hover:scale-110 active:scale-95",
              isComplete && "bg-primary shadow-glow",
              !isComplete && currentHours > 0 && "bg-primary/30",
              !isComplete && currentHours === 0 && !disabled && "bg-muted/50 hover:bg-muted border-2 border-dashed border-muted-foreground/20",
              currentHours === 0 && disabled && "bg-muted/30",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {currentHours > 0 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "font-semibold",
                  isComplete ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {currentHours.toFixed(1)}h
              </motion.span>
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            {/* Progress indicator at bottom */}
            {currentHours > 0 && !isComplete && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-primary"
                />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentHours.toFixed(1)}h / {targetHours}h target</p>
          <p className="text-xs text-muted-foreground">Click to add 30min</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Today
        </span>
        <span className={cn(
          "font-medium",
          isComplete && "text-primary"
        )}>
          {currentHours.toFixed(1)}h / {targetHours}h
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <Input
              type="number"
              step="0.5"
              min="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="h-8"
              autoFocus
            />
            <Button size="sm" onClick={handleSubmit} className="h-8">
              <Check className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-1"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(-0.5)}
              disabled={disabled || currentHours === 0}
              className="flex-1 h-8"
            >
              <Minus className="w-3 h-3 mr-1" />
              0.5h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={disabled}
              className="flex-1 h-8"
            >
              {currentHours.toFixed(1)}h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(0.5)}
              disabled={disabled}
              className="flex-1 h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              0.5h
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-primary font-medium"
        >
          🎉 Target reached!
        </motion.p>
      )}
    </div>
  );
}
