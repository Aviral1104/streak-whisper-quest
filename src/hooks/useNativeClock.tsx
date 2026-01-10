import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

export interface ClockState {
  hours: number;
  minutes: number;
  seconds: number;
  date: Date;
  formattedTime: string;
  formattedDate: string;
  dayOfWeek: string;
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
  currentHourSegment: number; // 0-23
  dayProgress: number; // 0-100 percentage of day completed
}

export interface CooldownState {
  habitId: string;
  lastLoggedAt: Date;
  cooldownEndsAt: Date;
  remainingMinutes: number;
  isOnCooldown: boolean;
}

const COOLDOWN_MINUTES = 60; // 1 hour cooldown between logs
const MAX_HOURS_PER_LOG = 1; // Maximum 1 hour per single log action
const DEFAULT_DAILY_CAP = 6; // Default daily maximum hours per habit

export function useNativeClock() {
  const [clockState, setClockState] = useState<ClockState>(() => calculateClockState(new Date()));
  const [cooldowns, setCooldowns] = useState<Map<string, CooldownState>>(new Map());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setClockState(calculateClockState(now));
      
      // Update cooldowns
      setCooldowns(prev => {
        const updated = new Map(prev);
        updated.forEach((cooldown, habitId) => {
          const remaining = Math.max(0, Math.ceil((cooldown.cooldownEndsAt.getTime() - now.getTime()) / 60000));
          if (remaining <= 0) {
            updated.delete(habitId);
          } else {
            updated.set(habitId, {
              ...cooldown,
              remainingMinutes: remaining,
              isOnCooldown: remaining > 0,
            });
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load cooldowns from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('habitflow_cooldowns');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = new Date();
        const restored = new Map<string, CooldownState>();
        
        Object.entries(parsed).forEach(([habitId, data]: [string, any]) => {
          const cooldownEndsAt = new Date(data.cooldownEndsAt);
          if (cooldownEndsAt > now) {
            restored.set(habitId, {
              habitId,
              lastLoggedAt: new Date(data.lastLoggedAt),
              cooldownEndsAt,
              remainingMinutes: Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 60000),
              isOnCooldown: true,
            });
          }
        });
        
        setCooldowns(restored);
      } catch (e) {
        console.error('Failed to restore cooldowns:', e);
      }
    }
  }, []);

  // Persist cooldowns to localStorage
  useEffect(() => {
    const obj: Record<string, { lastLoggedAt: string; cooldownEndsAt: string }> = {};
    cooldowns.forEach((cooldown, habitId) => {
      obj[habitId] = {
        lastLoggedAt: cooldown.lastLoggedAt.toISOString(),
        cooldownEndsAt: cooldown.cooldownEndsAt.toISOString(),
      };
    });
    localStorage.setItem('habitflow_cooldowns', JSON.stringify(obj));
  }, [cooldowns]);

  const startCooldown = useCallback((habitId: string) => {
    const now = new Date();
    const cooldownEndsAt = new Date(now.getTime() + COOLDOWN_MINUTES * 60000);
    
    setCooldowns(prev => {
      const updated = new Map(prev);
      updated.set(habitId, {
        habitId,
        lastLoggedAt: now,
        cooldownEndsAt,
        remainingMinutes: COOLDOWN_MINUTES,
        isOnCooldown: true,
      });
      return updated;
    });
  }, []);

  const getCooldownForHabit = useCallback((habitId: string): CooldownState | null => {
    return cooldowns.get(habitId) || null;
  }, [cooldowns]);

  const canLogTime = useCallback((habitId: string, currentDailyHours: number, dailyCap: number = DEFAULT_DAILY_CAP): { 
    canLog: boolean; 
    reason?: string; 
    cooldownRemaining?: number;
    maxAllowed?: number;
  } => {
    const cooldown = cooldowns.get(habitId);
    
    // Check cooldown
    if (cooldown && cooldown.isOnCooldown) {
      return {
        canLog: false,
        reason: `Cooldown active`,
        cooldownRemaining: cooldown.remainingMinutes,
      };
    }

    // Check daily cap
    if (currentDailyHours >= dailyCap) {
      return {
        canLog: false,
        reason: `Daily limit of ${dailyCap}h reached`,
      };
    }

    // Calculate max allowed for this log
    const remaining = dailyCap - currentDailyHours;
    const maxAllowed = Math.min(MAX_HOURS_PER_LOG, remaining);

    return {
      canLog: true,
      maxAllowed,
    };
  }, [cooldowns]);

  return {
    clockState,
    cooldowns,
    startCooldown,
    getCooldownForHabit,
    canLogTime,
    MAX_HOURS_PER_LOG,
    DEFAULT_DAILY_CAP,
    COOLDOWN_MINUTES,
  };
}

function calculateClockState(date: Date): ClockState {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Calculate angles for clock hands (360 degrees / 60 or 12 or 24)
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = ((hours % 12 + minutes / 60) / 12) * 360;

  // Day progress (0-100%)
  const totalSecondsInDay = 24 * 60 * 60;
  const currentSeconds = hours * 3600 + minutes * 60 + seconds;
  const dayProgress = (currentSeconds / totalSecondsInDay) * 100;

  return {
    hours,
    minutes,
    seconds,
    date,
    formattedTime: format(date, 'HH:mm'),
    formattedDate: format(date, 'MMM d, yyyy'),
    dayOfWeek: format(date, 'EEEE'),
    hourAngle,
    minuteAngle,
    secondAngle,
    currentHourSegment: hours,
    dayProgress,
  };
}
