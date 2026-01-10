import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRewards } from '@/hooks/useRewards';

export default function PerksAndBadges() {
  const { userRewards } = useRewards();
  
  // Filter to only show badge type rewards
  const ownedBadges = userRewards.filter(ur => ur.reward?.type === 'badge');

  if (ownedBadges.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-8 text-center">
            <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Earn badges from the Shop to showcase your consistency.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Perks & Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {ownedBadges.map((ur, index) => (
              <motion.div
                key={ur.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-3 border border-primary/20"
              >
                <div className="text-3xl">{ur.reward?.icon}</div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{ur.reward?.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {ur.reward?.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
