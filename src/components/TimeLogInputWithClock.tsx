import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Lock, Timer, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TimeLogInputWithClockProps {
  habitId: string;
  currentHours: number;
  targetHours: number;
  dailyCap?: number;
  onLogTime: (hours: number) => void;
  canLog: boolean;
  cooldownRemaining?: number;
  maxAllowed?: number;
  blockReason?: string;
  onCooldownStart?: () => void;
}

export default function TimeLogInputWithClock({
  habitId,
  currentHours,
  targetHours,
  dailyCap = 6,
  onLogTime,
  canLog,
  cooldownRemaining = 0,
  maxAllowed = 1,
  blockReason,
  onCooldownStart,
}: TimeLogInputWithClockProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedHours, setSelectedHours] = useState(0.5);

  const progressPercent = targetHours > 0 ? Math.min((currentHours / targetHours) * 100, 100) : 0;
  const capPercent = dailyCap > 0 ? Math.min((currentHours / dailyCap) * 100, 100) : 0;
  const isTargetMet = currentHours >= targetHours;
  const isCapReached = currentHours >= dailyCap;

  const quickOptions = [0.25, 0.5, 1].filter(h => h <= maxAllowed);

  const handleLog = useCallback((hours: number) => {
    if (!canLog || hours > maxAllowed) return;
    
    const newTotal = currentHours + hours;
    onLogTime(newTotal);
    onCooldownStart?.();
    setShowConfirm(false);
  }, [canLog, maxAllowed, currentHours, onLogTime, onCooldownStart]);

  return (
    <div className="space-y-3">
      {/* Progress bars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Today's Progress
          </span>
          <span className={cn(
            "font-medium tabular-nums",
            isTargetMet && "text-primary"
          )}>
            {currentHours.toFixed(1)}h / {targetHours}h
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />

        {/* Daily cap indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Daily limit</span>
          <span className={cn(
            "font-medium tabular-nums",
            isCapReached && "text-destructive"
          )}>
            {currentHours.toFixed(1)} / {dailyCap}h max
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isCapReached ? "bg-destructive" : "bg-muted-foreground/30"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${capPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Cooldown/Block state */}
      <AnimatePresence mode="wait">
        {!canLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/50 rounded-lg p-3 border border-border"
          >
            <div className="flex items-center gap-2">
              {cooldownRemaining > 0 ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  >
                    <Timer className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      Cooldown Active
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Available in {cooldownRemaining} minutes
                    </div>
                  </div>
                  {/* Cooldown progress ring */}
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <motion.circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={100}
                        strokeDashoffset={100 - (1 - cooldownRemaining / 60) * 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono">
                      {cooldownRemaining}m
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-destructive">
                      {blockReason || "Cannot log more time"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log buttons */}
      <AnimatePresence mode="wait">
        {canLog && !showConfirm && (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            {quickOptions.map((hours) => (
              <Button
                key={hours}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedHours(hours);
                  setShowConfirm(true);
                }}
                className="flex-1 gap-1"
              >
                <Plus className="w-3 h-3" />
                {hours}h
              </Button>
            ))}
          </motion.div>
        )}

        {canLog && showConfirm && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-primary/10 rounded-lg p-3 border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Log {selectedHours}h?</p>
                <p className="text-xs text-muted-foreground">
                  1 hour cooldown will start after logging
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLog(selectedHours)}
                  className="gap-1"
                >
                  <Check className="w-3 h-3" />
                  Confirm
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target met celebration */}
      <AnimatePresence>
        {isTargetMet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <span className="text-primary font-medium text-sm">
              🎉 Daily target reached!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
