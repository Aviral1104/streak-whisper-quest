import { motion } from 'framer-motion';
import { Target, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export default function EmptyState({ onCreateHabit }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow"
      >
        <Target className="w-10 h-10 text-primary-foreground" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Start Your Journey
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Create your first habit and begin building the life you want. 
        Every great achievement starts with a single step.
      </p>
      
      <Button onClick={onCreateHabit} size="lg" className="gap-2">
        <Plus className="w-5 h-5" />
        Create Your First Habit
      </Button>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center max-w-lg">
        {[
          { icon: '🎯', label: 'Set Goals' },
          { icon: '📈', label: 'Track Progress' },
          { icon: '🏆', label: 'Earn Rewards' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
