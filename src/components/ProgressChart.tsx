import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { HabitCompletion, Habit } from '@/hooks/useHabits';

interface ProgressChartProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

export default function ProgressChart({ habits, completions }: ProgressChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: subDays(today, 13),
      end: today,
    });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayCompletions = completions.filter(c => c.completed_at === dateStr);
      const completionRate = habits.length > 0 
        ? Math.round((dayCompletions.length / habits.length) * 100)
        : 0;

      return {
        date: format(day, 'MMM d'),
        completions: dayCompletions.length,
        rate: completionRate,
      };
    });
  }, [habits, completions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-medium">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} habits ({payload[1].value}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Progress Overview</h3>
        <p className="text-sm text-muted-foreground">Last 14 days</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="completions"
              stroke="hsl(158, 64%, 42%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompletions)"
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="transparent"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
