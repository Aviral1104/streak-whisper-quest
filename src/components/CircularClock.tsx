import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ClockState } from '@/hooks/useNativeClock';
import type { TimeLog } from '@/hooks/useTimeLogs';
import { format } from 'date-fns';

interface CircularClockProps {
  clockState: ClockState;
  timeLogs?: TimeLog[];
  cooldowns?: Map<string, { remainingMinutes: number; isOnCooldown: boolean }>;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
  onLogConfirm?: () => void;
}

export default function CircularClock({
  clockState,
  timeLogs = [],
  cooldowns = new Map(),
  size = 'md',
  showDate = true,
  onLogConfirm,
}: CircularClockProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const dimensions = {
    sm: { outer: 160, inner: 120, strokeWidth: 8 },
    md: { outer: 240, inner: 180, strokeWidth: 12 },
    lg: { outer: 320, inner: 250, strokeWidth: 16 },
  };

  const { outer, inner, strokeWidth } = dimensions[size];
  const center = outer / 2;
  const radius = (outer - strokeWidth) / 2;

  // Calculate today's logged hours by hour segment
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = timeLogs.filter(log => log.logged_at === today);
  const totalLoggedToday = todayLogs.reduce((sum, log) => sum + log.hours, 0);

  // Create 24 hour segments
  const hourSegments = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const isCurrentHour = i === clockState.currentHourSegment;
      const isPastHour = i < clockState.currentHourSegment;
      const isFutureHour = i > clockState.currentHourSegment;
      
      // Calculate angle for this segment (starting from top, going clockwise)
      const startAngle = (i / 24) * 360 - 90;
      const endAngle = ((i + 1) / 24) * 360 - 90;
      
      return {
        hour: i,
        isCurrentHour,
        isPastHour,
        isFutureHour,
        startAngle,
        endAngle,
      };
    });
  }, [clockState.currentHourSegment]);

  // Trigger pulse animation on log
  useEffect(() => {
    if (onLogConfirm) {
      setPulseAnimation(true);
      const timeout = setTimeout(() => setPulseAnimation(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [totalLoggedToday]);

  // Calculate progress arc path
  const progressArc = useMemo(() => {
    const angle = (clockState.dayProgress / 100) * 360;
    return describeArc(center, center, radius - strokeWidth / 2, -90, -90 + angle);
  }, [clockState.dayProgress, center, radius, strokeWidth]);

  // Check if any cooldowns are active
  const hasActiveCooldown = Array.from(cooldowns.values()).some(c => c.isOnCooldown);
  const maxCooldown = Math.max(0, ...Array.from(cooldowns.values()).map(c => c.remainingMinutes));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Clock */}
      <motion.div
        className="relative"
        animate={pulseAnimation ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <svg
          width={outer}
          height={outer}
          className="drop-shadow-lg"
        >
          {/* Outer glow effect */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
            <linearGradient id="currentHourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--streak))" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth={strokeWidth}
            className="transition-colors duration-300"
          />

          {/* Hour segment markers */}
          {hourSegments.map((segment) => {
            const angle = segment.startAngle;
            const x1 = center + (radius - strokeWidth) * Math.cos((angle * Math.PI) / 180);
            const y1 = center + (radius - strokeWidth) * Math.sin((angle * Math.PI) / 180);
            const x2 = center + (radius + 2) * Math.cos((angle * Math.PI) / 180);
            const y2 = center + (radius + 2) * Math.sin((angle * Math.PI) / 180);
            
            const isMainHour = segment.hour % 6 === 0;
            
            return (
              <line
                key={segment.hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={segment.isCurrentHour 
                  ? "hsl(var(--primary))" 
                  : segment.isPastHour 
                    ? "hsl(var(--muted) / 0.5)" 
                    : "hsl(var(--muted) / 0.2)"}
                strokeWidth={isMainHour ? 3 : 1}
                className="transition-colors duration-300"
              />
            );
          })}

          {/* Progress arc (day completion) */}
          <path
            d={progressArc}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            filter="url(#glow)"
            className="transition-all duration-1000"
          />

          {/* Current hour highlight */}
          <motion.circle
            cx={center + (radius) * Math.cos(((clockState.currentHourSegment / 24) * 360 - 90) * Math.PI / 180)}
            cy={center + (radius) * Math.sin(((clockState.currentHourSegment / 24) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 2}
            fill="url(#currentHourGradient)"
            filter="url(#glow)"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Minute hand indicator (subtle) */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius - strokeWidth * 2) * Math.cos((clockState.minuteAngle - 90) * Math.PI / 180)}
            y2={center + (radius - strokeWidth * 2) * Math.sin((clockState.minuteAngle - 90) * Math.PI / 180)}
            stroke="hsl(var(--primary) / 0.4)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Inner circle (background) */}
          <circle
            cx={center}
            cy={center}
            r={inner / 2}
            fill="hsl(var(--card))"
            className="transition-colors duration-300"
          />
          
          {/* Inner ring border */}
          <circle
            cx={center}
            cy={center}
            r={inner / 2}
            fill="none"
            stroke="hsl(var(--border) / 0.5)"
            strokeWidth={1}
          />
        </svg>

        {/* Center content */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ 
            top: (outer - inner) / 2, 
            left: (outer - inner) / 2,
            width: inner,
            height: inner,
          }}
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={cn(
              "font-mono font-bold tracking-tight text-foreground",
              size === 'sm' && "text-2xl",
              size === 'md' && "text-4xl",
              size === 'lg' && "text-5xl",
            )}>
              {clockState.formattedTime}
            </div>
            
            {showDate && (
              <div className="mt-1 text-muted-foreground text-sm">
                {clockState.dayOfWeek}
              </div>
            )}

            {/* Cooldown indicator */}
            <AnimatePresence>
              {hasActiveCooldown && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground"
                >
                  ⏳ {maxCooldown}m cooldown
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Date display */}
      {showDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-lg font-medium text-foreground">
            {clockState.formattedDate}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalLoggedToday.toFixed(1)}h logged today
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Helper function to describe an SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}
