import { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
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
  lastLogTimestamp?: number; // Used to trigger animations
}

export default function CircularClock({
  clockState,
  timeLogs = [],
  cooldowns = new Map(),
  size = 'md',
  showDate = true,
  lastLogTimestamp,
}: CircularClockProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [showLogConfirm, setShowLogConfirm] = useState(false);
  const [filledSegments, setFilledSegments] = useState<Set<number>>(new Set());
  const pulseControls = useAnimation();
  const ringControls = useAnimation();
  const prevLogCount = useRef(0);

  const dimensions = {
    sm: { outer: 160, inner: 120, strokeWidth: 8 },
    md: { outer: 240, inner: 180, strokeWidth: 12 },
    lg: { outer: 320, inner: 250, strokeWidth: 16 },
  };

  const { outer, inner, strokeWidth } = dimensions[size];
  const center = outer / 2;
  const radius = (outer - strokeWidth) / 2;

  // Calculate today's logged hours
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = timeLogs.filter(log => log.logged_at === today);
  const totalLoggedToday = todayLogs.reduce((sum, log) => sum + log.hours, 0);

  // Create 24 hour segments with fill status based on logged hours
  const hourSegments = useMemo(() => {
    // Calculate which hour segments are "filled" based on logged hours
    const hoursPerSegment = new Map<number, number>();
    todayLogs.forEach(log => {
      // Distribute logged hours across segments starting from current hour going back
      let remainingHours = log.hours;
      let segment = clockState.currentHourSegment;
      while (remainingHours > 0 && segment >= 0) {
        const existing = hoursPerSegment.get(segment) || 0;
        const toAdd = Math.min(remainingHours, 1 - existing);
        hoursPerSegment.set(segment, existing + toAdd);
        remainingHours -= toAdd;
        segment--;
      }
    });

    return Array.from({ length: 24 }, (_, i) => {
      const isCurrentHour = i === clockState.currentHourSegment;
      const isPastHour = i < clockState.currentHourSegment;
      const isFutureHour = i > clockState.currentHourSegment;
      const fillPercent = hoursPerSegment.get(i) || 0;
      
      const startAngle = (i / 24) * 360 - 90;
      const endAngle = ((i + 1) / 24) * 360 - 90;
      
      return {
        hour: i,
        isCurrentHour,
        isPastHour,
        isFutureHour,
        startAngle,
        endAngle,
        fillPercent,
        isFilled: fillPercent > 0,
      };
    });
  }, [clockState.currentHourSegment, todayLogs]);

  // Trigger pulse animation when new log is added
  useEffect(() => {
    if (lastLogTimestamp) {
      triggerLogAnimation();
    }
  }, [lastLogTimestamp]);

  // Also trigger when log count increases
  useEffect(() => {
    if (todayLogs.length > prevLogCount.current) {
      triggerLogAnimation();
      // Add the current hour to filled segments with animation
      setFilledSegments(prev => new Set([...prev, clockState.currentHourSegment]));
    }
    prevLogCount.current = todayLogs.length;
  }, [todayLogs.length, clockState.currentHourSegment]);

  const triggerLogAnimation = async () => {
    setIsPulsing(true);
    setShowLogConfirm(true);
    
    // Pulse the entire clock
    await pulseControls.start({
      scale: [1, 1.08, 1],
      transition: { duration: 0.4, ease: "easeOut" }
    });
    
    // Ring glow animation
    await ringControls.start({
      opacity: [0.3, 1, 0.3],
      transition: { duration: 0.6, ease: "easeInOut" }
    });
    
    setIsPulsing(false);
    setTimeout(() => setShowLogConfirm(false), 1500);
  };

  // Calculate progress arc path
  const progressArc = useMemo(() => {
    const angle = (clockState.dayProgress / 100) * 360;
    if (angle <= 0) return '';
    return describeArc(center, center, radius - strokeWidth / 2, -90, -90 + angle);
  }, [clockState.dayProgress, center, radius, strokeWidth]);

  // Calculate logged hours arc (visual representation of work done)
  const loggedArc = useMemo(() => {
    const hoursAngle = (totalLoggedToday / 24) * 360;
    if (hoursAngle <= 0) return '';
    return describeArc(center, center, radius - strokeWidth * 1.5, -90, -90 + hoursAngle);
  }, [totalLoggedToday, center, radius, strokeWidth]);

  const hasActiveCooldown = Array.from(cooldowns.values()).some(c => c.isOnCooldown);
  const maxCooldown = Math.max(0, ...Array.from(cooldowns.values()).map(c => c.remainingMinutes));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Clock */}
      <motion.div
        className="relative"
        animate={pulseControls}
      >
        <svg
          width={outer}
          height={outer}
          className="drop-shadow-lg"
        >
          <defs>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Stronger pulse glow */}
            <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradients */}
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
            <linearGradient id="loggedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--streak))" />
              <stop offset="100%" stopColor="hsl(var(--coin))" />
            </linearGradient>
            <linearGradient id="currentHourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--streak))" />
            </linearGradient>
            <linearGradient id="filledSegmentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--success))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>

          {/* Pulse ring (animated on log) */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius + 8}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isPulsing ? {
              opacity: [0, 0.8, 0],
              scale: [0.95, 1.1, 1.15],
            } : { opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

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

          {/* Hour segment arcs with fill animation */}
          {hourSegments.map((segment) => {
            if (!segment.isFilled) return null;
            
            const arcPath = describeArc(
              center, 
              center, 
              radius, 
              segment.startAngle, 
              segment.startAngle + (15 * segment.fillPercent) // 15 degrees per segment
            );
            
            return (
              <motion.path
                key={`fill-${segment.hour}`}
                d={arcPath}
                fill="none"
                stroke="url(#filledSegmentGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 0.8,
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: segment.hour * 0.02,
                  ease: "easeOut" 
                }}
              />
            );
          })}

          {/* Hour segment markers */}
          {hourSegments.map((segment) => {
            const angle = segment.startAngle;
            const innerRadius = radius - strokeWidth;
            const outerRadius = radius + 2;
            const x1 = center + innerRadius * Math.cos((angle * Math.PI) / 180);
            const y1 = center + innerRadius * Math.sin((angle * Math.PI) / 180);
            const x2 = center + outerRadius * Math.cos((angle * Math.PI) / 180);
            const y2 = center + outerRadius * Math.sin((angle * Math.PI) / 180);
            
            const isMainHour = segment.hour % 6 === 0;
            
            return (
              <motion.line
                key={segment.hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={segment.isFilled
                  ? "hsl(var(--success))"
                  : segment.isCurrentHour 
                    ? "hsl(var(--primary))" 
                    : segment.isPastHour 
                      ? "hsl(var(--muted) / 0.5)" 
                      : "hsl(var(--muted) / 0.2)"}
                strokeWidth={isMainHour ? 3 : 1}
                initial={false}
                animate={segment.isFilled ? {
                  stroke: ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--success))"],
                } : {}}
                transition={{ duration: 2, repeat: segment.isFilled ? Infinity : 0 }}
              />
            );
          })}

          {/* Progress arc (day time elapsed) */}
          {progressArc && (
            <path
              d={progressArc}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth - 4}
              strokeLinecap="round"
              filter={isPulsing ? "url(#pulseGlow)" : "url(#glow)"}
              className="transition-all duration-1000"
            />
          )}

          {/* Logged hours arc (inner ring) */}
          {loggedArc && (
            <motion.path
              d={loggedArc}
              fill="none"
              stroke="url(#loggedGradient)"
              strokeWidth={4}
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          )}

          {/* Current hour highlight with pulse */}
          <motion.circle
            cx={center + radius * Math.cos(((clockState.currentHourSegment / 24) * 360 - 90) * Math.PI / 180)}
            cy={center + radius * Math.sin(((clockState.currentHourSegment / 24) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 2}
            fill="url(#currentHourGradient)"
            filter={isPulsing ? "url(#pulseGlow)" : "url(#glow)"}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Second hand (thin, subtle) */}
          <motion.line
            x1={center}
            y1={center}
            x2={center + (radius - strokeWidth * 1.5) * Math.cos((clockState.secondAngle - 90) * Math.PI / 180)}
            y2={center + (radius - strokeWidth * 1.5) * Math.sin((clockState.secondAngle - 90) * Math.PI / 180)}
            stroke="hsl(var(--destructive) / 0.6)"
            strokeWidth={1}
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius - strokeWidth * 2) * Math.cos((clockState.minuteAngle - 90) * Math.PI / 180)}
            y2={center + (radius - strokeWidth * 2) * Math.sin((clockState.minuteAngle - 90) * Math.PI / 180)}
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={4}
            fill="hsl(var(--primary))"
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
          <motion.circle
            cx={center}
            cy={center}
            r={inner / 2}
            fill="none"
            stroke={isPulsing ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}
            strokeWidth={isPulsing ? 2 : 1}
            animate={ringControls}
          />
        </svg>

        {/* Center content */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
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
            {/* Time display with seconds */}
            <motion.div 
              className={cn(
                "font-mono font-bold tracking-tight text-foreground tabular-nums",
                size === 'sm' && "text-2xl",
                size === 'md' && "text-4xl",
                size === 'lg' && "text-5xl",
              )}
              animate={isPulsing ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {clockState.formattedTime}
              <span className="text-muted-foreground text-lg ml-0.5">
                :{String(clockState.seconds).padStart(2, '0')}
              </span>
            </motion.div>
            
            {showDate && (
              <div className="mt-1 text-muted-foreground text-sm">
                {clockState.dayOfWeek}
              </div>
            )}

            {/* Log confirmation popup */}
            <AnimatePresence>
              {showLogConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -10 }}
                  className="mt-2 px-3 py-1.5 bg-success/20 border border-success/30 rounded-full text-xs font-medium text-success"
                >
                  ✓ Time logged!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cooldown indicator */}
            <AnimatePresence>
              {hasActiveCooldown && !showLogConfirm && (
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

      {/* Date and stats display */}
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
          <motion.div 
            className="text-sm text-muted-foreground mt-1"
            animate={isPulsing ? { 
              color: ["hsl(var(--muted-foreground))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"] 
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="font-semibold text-primary">{totalLoggedToday.toFixed(1)}h</span> logged today
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Helper function to describe an SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  if (endAngle <= startAngle) return '';
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
