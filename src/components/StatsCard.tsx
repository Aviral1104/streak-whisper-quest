import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent' | 'streak';
  delay?: number;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  variant = 'default',
  delay = 0 
}: StatsCardProps) {
  const variants = {
    default: 'bg-card border-border',
    primary: 'bg-primary/5 border-primary/20',
    accent: 'bg-accent/10 border-accent/20',
    streak: 'bg-streak/10 border-streak/20',
  };

  const iconVariants = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'gradient-primary text-primary-foreground',
    accent: 'gradient-accent text-accent-foreground',
    streak: 'bg-streak text-streak-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "p-5 rounded-2xl border transition-all",
        variants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          iconVariants[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
