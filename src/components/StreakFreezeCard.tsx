import { motion } from 'framer-motion';
import { Snowflake } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';

export default function StreakFreezeCard() {
  const { settings } = useUserSettings();
  const freezesRemaining = settings?.streak_freezes_remaining || 0;

  if (freezesRemaining === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl"
    >
      <Snowflake className="w-4 h-4 text-sky-400" />
      <span className="text-sm font-medium text-sky-400">
        {freezesRemaining} ❄️
      </span>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        streak freeze{freezesRemaining !== 1 ? 's' : ''} available
      </span>
    </motion.div>
  );
}
