import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ClockState } from '@/hooks/useNativeClock';

interface DigitalClockProps {
  clockState: ClockState;
  size?: 'sm' | 'md' | 'lg';
  showSeconds?: boolean;
  showDate?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

export default function DigitalClock({
  clockState,
  size = 'md',
  showSeconds = true,
  showDate = true,
  className,
  variant = 'default',
}: DigitalClockProps) {
  const sizeClasses = {
    sm: {
      time: 'text-2xl',
      seconds: 'text-sm',
      date: 'text-xs',
      day: 'text-xs',
    },
    md: {
      time: 'text-4xl',
      seconds: 'text-xl',
      date: 'text-sm',
      day: 'text-sm',
    },
    lg: {
      time: 'text-6xl',
      seconds: 'text-2xl',
      date: 'text-base',
      day: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  const wrapperClasses = cn(
    'text-center',
    variant === 'card' && 'bg-card border border-border rounded-2xl p-4 shadow-soft',
    variant === 'minimal' && 'bg-transparent',
    className
  );

  return (
    <motion.div
      className={wrapperClasses}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main time display */}
      <div className="flex items-baseline justify-center">
        {/* Hours */}
        <motion.span
          key={clockState.hours}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'font-mono font-bold tabular-nums text-foreground',
            classes.time
          )}
        >
          {String(clockState.hours).padStart(2, '0')}
        </motion.span>

        {/* Blinking colon */}
        <motion.span
          className={cn(
            'font-mono font-bold text-primary mx-0.5',
            classes.time
          )}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          :
        </motion.span>

        {/* Minutes */}
        <motion.span
          key={clockState.minutes}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'font-mono font-bold tabular-nums text-foreground',
            classes.time
          )}
        >
          {String(clockState.minutes).padStart(2, '0')}
        </motion.span>

        {/* Seconds */}
        {showSeconds && (
          <>
            <motion.span
              className={cn(
                'font-mono text-muted-foreground mx-0.5',
                classes.seconds
              )}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.span>
            <motion.span
              key={clockState.seconds}
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                'font-mono tabular-nums text-muted-foreground',
                classes.seconds
              )}
            >
              {String(clockState.seconds).padStart(2, '0')}
            </motion.span>
          </>
        )}
      </div>

      {/* Date display */}
      {showDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 space-y-0.5"
        >
          <div className={cn('font-medium text-foreground', classes.day)}>
            {clockState.dayOfWeek}
          </div>
          <div className={cn('text-muted-foreground', classes.date)}>
            {clockState.formattedDate}
          </div>
        </motion.div>
      )}

      {/* Progress bar for day completion */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 h-1 bg-muted rounded-full overflow-hidden origin-left"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
          style={{ width: `${clockState.dayProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${clockState.dayProgress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </motion.div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>{Math.round(clockState.dayProgress)}% of day</span>
        <span>24:00</span>
      </div>
    </motion.div>
  );
}
