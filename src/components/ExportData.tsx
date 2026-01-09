import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import type { Habit, HabitCompletion } from '@/hooks/useHabits';
import type { TimeLog } from '@/hooks/useTimeLogs';

interface ExportOptions {
  habits: Habit[];
  completions: HabitCompletion[];
  timeLogs: TimeLog[];
  currentMonth: Date;
}

export function exportToCSV({ habits, completions, timeLogs, currentMonth }: ExportOptions) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Build comprehensive data rows - one row per habit per day
  const rows: string[][] = [];
  
  // Header row
  const headers = [
    'Date',
    'Day of Week',
    'Habit Name',
    'Habit Type',
    'Target',
    'Actual',
    'Completed',
    'Streak',
    'Notes'
  ];
  rows.push(headers);

  // Data rows
  monthDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const displayDate = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEEE');

    habits.forEach(habit => {
      const isTimeHabit = habit.habit_type === 'hours';
      
      if (isTimeHabit) {
        // Time-based habit
        const timeLog = timeLogs.find(
          l => l.habit_id === habit.id && l.logged_at === dateStr
        );
        const target = habit.target_hours_daily 
          ? `${habit.target_hours_daily}h/day` 
          : habit.target_hours_weekly 
            ? `${habit.target_hours_weekly}h/week` 
            : '-';
        const actual = timeLog ? `${timeLog.hours}h` : '0h';
        const targetHours = habit.target_hours_daily || 0;
        const completed = timeLog && targetHours > 0 && timeLog.hours >= targetHours ? 'Yes' : 'No';
        
        rows.push([
          displayDate,
          dayName,
          habit.name,
          'Time-tracked',
          target,
          actual,
          completed,
          String(habit.current_streak),
          timeLog?.notes || ''
        ]);
      } else {
        // Checkbox habit
        const completion = completions.find(
          c => c.habit_id === habit.id && c.completed_at === dateStr
        );
        const completed = completion ? 'Yes' : 'No';
        
        rows.push([
          displayDate,
          dayName,
          habit.name,
          'Checkbox',
          '1 completion',
          completed === 'Yes' ? '1' : '0',
          completed,
          String(habit.current_streak),
          ''
        ]);
      }
    });
  });

  // Add summary section
  rows.push([]);
  rows.push(['--- SUMMARY ---', '', '', '', '', '', '', '', '']);
  rows.push([]);
  
  // Per-habit summary
  rows.push(['Habit Summary', '', '', '', '', '', '', '', '']);
  
  habits.forEach(habit => {
    const isTimeHabit = habit.habit_type === 'hours';
    
    if (isTimeHabit) {
      const habitLogs = timeLogs.filter(l => l.habit_id === habit.id);
      const monthLogs = habitLogs.filter(l => {
        const logDate = new Date(l.logged_at);
        return logDate >= monthStart && logDate <= monthEnd;
      });
      const totalHours = monthLogs.reduce((sum, l) => sum + l.hours, 0);
      const daysLogged = monthLogs.length;
      const target = habit.target_hours_daily 
        ? habit.target_hours_daily * monthDays.length 
        : habit.target_hours_weekly 
          ? (habit.target_hours_weekly / 7) * monthDays.length 
          : 0;
      
      rows.push([
        habit.name,
        'Time-tracked',
        '',
        `Target: ${Math.round(target * 10) / 10}h`,
        `Actual: ${Math.round(totalHours * 10) / 10}h`,
        `Days active: ${daysLogged}`,
        `Achievement: ${target > 0 ? Math.round((totalHours / target) * 100) : 0}%`,
        `Current streak: ${habit.current_streak}`,
        `Best streak: ${habit.longest_streak}`
      ]);
    } else {
      const habitCompletions = completions.filter(c => {
        return c.habit_id === habit.id && 
          new Date(c.completed_at) >= monthStart && 
          new Date(c.completed_at) <= monthEnd;
      });
      const daysCompleted = habitCompletions.length;
      const completionRate = Math.round((daysCompleted / monthDays.length) * 100);
      
      rows.push([
        habit.name,
        'Checkbox',
        '',
        `Target: ${monthDays.length} days`,
        `Completed: ${daysCompleted} days`,
        `Completion rate: ${completionRate}%`,
        '',
        `Current streak: ${habit.current_streak}`,
        `Best streak: ${habit.longest_streak}`
      ]);
    }
  });

  // Overall summary
  rows.push([]);
  rows.push(['Overall Statistics', '', '', '', '', '', '', '', '']);
  
  const checkboxHabits = habits.filter(h => h.habit_type !== 'hours');
  const timeHabits = habits.filter(h => h.habit_type === 'hours');
  
  const totalCheckboxCompletions = completions.filter(c => {
    const isCheckboxHabit = checkboxHabits.some(h => h.id === c.habit_id);
    const compDate = new Date(c.completed_at);
    return isCheckboxHabit && compDate >= monthStart && compDate <= monthEnd;
  }).length;
  
  const totalPossibleCheckbox = checkboxHabits.length * monthDays.length;
  const checkboxRate = totalPossibleCheckbox > 0 
    ? Math.round((totalCheckboxCompletions / totalPossibleCheckbox) * 100) 
    : 0;
  
  const totalTimeHours = timeLogs
    .filter(l => {
      const logDate = new Date(l.logged_at);
      return logDate >= monthStart && logDate <= monthEnd;
    })
    .reduce((sum, l) => sum + l.hours, 0);

  rows.push([
    'Month',
    format(currentMonth, 'MMMM yyyy'),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  rows.push([
    'Checkbox habits completion',
    `${totalCheckboxCompletions}/${totalPossibleCheckbox}`,
    `${checkboxRate}%`,
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  rows.push([
    'Total time logged',
    `${Math.round(totalTimeHours * 10) / 10} hours`,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  rows.push([
    'Habits tracked',
    `${habits.length} (${checkboxHabits.length} checkbox, ${timeHabits.length} time-based)`,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  // Escape and format CSV
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = rows
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n');

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `habitflow-${format(currentMonth, 'yyyy-MM')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return true;
}
