import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Palette, Snowflake, Coins, Check, ShoppingBag, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRewards, Reward } from '@/hooks/useRewards';
import { useUserSettings, THEME_CONFIGS } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const typeIcons = {
  badge: Award,
  theme: Palette,
  streak_freeze: Snowflake,
};

function RewardCard({ 
  reward, 
  owned, 
  quantity,
  coins,
  isActiveTheme,
  onPurchase,
  onApplyTheme 
}: { 
  reward: Reward; 
  owned: boolean;
  quantity: number;
  coins: number;
  isActiveTheme?: boolean;
  onPurchase: (reward: Reward) => void;
  onApplyTheme?: (reward: Reward) => void;
}) {
  const canAfford = coins >= reward.cost;
  const isFreeze = reward.type === 'streak_freeze';
  const isTheme = reward.type === 'theme';
  const canBuy = canAfford && (isFreeze || !owned);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden ${
        isActiveTheme 
          ? 'border-primary ring-2 ring-primary/30 bg-primary/10' 
          : owned && !isFreeze 
            ? 'border-primary/50 bg-primary/5' 
            : ''
      }`}>
        {isActiveTheme && (
          <div className="absolute top-2 right-2">
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Sparkles className="w-3 h-3" /> Active
            </Badge>
          </div>
        )}
        {!isActiveTheme && owned && !isFreeze && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="gap-1">
              <Check className="w-3 h-3" /> Owned
            </Badge>
          </div>
        )}
        {isFreeze && quantity > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">x{quantity}</Badge>
          </div>
        )}
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2">{reward.icon}</div>
          <CardTitle className="text-lg">{reward.name}</CardTitle>
          <CardDescription className="text-sm">{reward.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Coins className="w-4 h-4" />
              {reward.cost}
            </div>
            <div className="flex gap-1">
              {isTheme && owned && !isActiveTheme && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyTheme?.(reward)}
                >
                  Apply
                </Button>
              )}
              <Button
                size="sm"
                variant={canBuy ? 'default' : 'secondary'}
                disabled={!canBuy}
                onClick={() => onPurchase(reward)}
              >
                {owned && !isFreeze ? 'Owned' : canAfford ? 'Buy' : 'Need coins'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Rewards() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { rewards, profile, purchaseReward, hasReward, getRewardQuantity, userRewards, isLoading } = useRewards();
  const { settings, setActiveTheme, applyTheme, hasStreakFreezes } = useUserSettings();
  const [purchasingReward, setPurchasingReward] = useState<Reward | null>(null);
  const coins = profile?.coins || 0;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Apply the active theme on mount and when settings change
  useEffect(() => {
    if (settings?.active_theme_id) {
      applyTheme(settings.active_theme_id);
    }
  }, [settings?.active_theme_id, applyTheme]);

  const badges = rewards.filter(r => r.type === 'badge');
  const themes = rewards.filter(r => r.type === 'theme');
  const freezes = rewards.filter(r => r.type === 'streak_freeze');

  const handlePurchase = (reward: Reward) => {
    setPurchasingReward(reward);
  };

  const handleApplyTheme = (reward: Reward) => {
    setActiveTheme.mutate(reward.id);
    applyTheme(reward.id);
  };

  const confirmPurchase = () => {
    if (purchasingReward) {
      purchaseReward.mutate(purchasingReward);
      setPurchasingReward(null);
    }
  };

  if (loading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-primary" />
                Rewards Shop
              </h1>
              <p className="text-muted-foreground mt-1">
                Spend your hard-earned coins on rewards
              </p>
            </div>
            <div className="flex gap-3">
              {/* Streak Freezes Display */}
              {settings && settings.streak_freezes_remaining > 0 && (
                <Card className="px-4 py-2 flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800">
                  <Snowflake className="w-5 h-5 text-sky-500" />
                  <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    {settings.streak_freezes_remaining}
                  </span>
                  <span className="text-xs text-sky-600/70 dark:text-sky-400/70">freezes</span>
                </Card>
              )}
              {/* Coins Display */}
              <Card className="px-4 py-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{coins}</span>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* My Rewards Section */}
        {userRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              My Rewards
            </h2>
            <div className="flex flex-wrap gap-3">
              {userRewards.map((ur) => {
                const isActiveTheme = ur.reward?.type === 'theme' && settings?.active_theme_id === ur.reward_id;
                return (
                  <motion.div
                    key={ur.id}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      if (ur.reward?.type === 'theme' && !isActiveTheme) {
                        handleApplyTheme(ur.reward);
                      }
                    }}
                    className={`bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center border cursor-pointer transition-all ${
                      isActiveTheme 
                        ? 'border-primary ring-2 ring-primary/30' 
                        : 'border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="text-3xl mb-1">{ur.reward?.icon}</div>
                    <div className="text-xs font-medium text-muted-foreground">{ur.reward?.name}</div>
                    {isActiveTheme && (
                      <Badge className="mt-1 text-[10px] bg-primary/20 text-primary">Active</Badge>
                    )}
                    {ur.quantity > 1 && (
                      <Badge variant="secondary" className="mt-1">x{ur.quantity}</Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Shop Tabs */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="w-4 h-4" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="freezes" className="gap-2">
              <Snowflake className="w-4 h-4" />
              Streak Freezes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
            {badges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No badges available yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {badges.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      owned={hasReward(reward.id)}
                      quantity={getRewardQuantity(reward.id)}
                      coins={coins}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="themes">
            {themes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No themes available yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {themes.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      owned={hasReward(reward.id)}
                      quantity={getRewardQuantity(reward.id)}
                      coins={coins}
                      isActiveTheme={settings?.active_theme_id === reward.id}
                      onPurchase={handlePurchase}
                      onApplyTheme={handleApplyTheme}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="freezes">
            <div className="mb-4 p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Snowflake className="w-6 h-6 text-sky-500" />
                <div>
                  <div className="font-semibold text-sky-700 dark:text-sky-300">
                    You have {settings?.streak_freezes_remaining || 0} streak freeze{(settings?.streak_freezes_remaining || 0) !== 1 ? 's' : ''} available
                  </div>
                  <div className="text-sm text-sky-600/70 dark:text-sky-400/70">
                    Streak freezes are automatically used when you miss a day
                  </div>
                </div>
              </div>
            </div>
            {freezes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No streak freezes available yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {freezes.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      owned={hasReward(reward.id)}
                      quantity={getRewardQuantity(reward.id)}
                      coins={coins}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Purchase Confirmation */}
      <AlertDialog open={!!purchasingReward} onOpenChange={() => setPurchasingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{purchasingReward?.icon}</span>
              Purchase {purchasingReward?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cost <span className="font-semibold text-amber-500">{purchasingReward?.cost} coins</span>. 
              You currently have <span className="font-semibold">{coins} coins</span>.
              {purchasingReward && coins - purchasingReward.cost >= 0 && (
                <span className="block mt-2 text-muted-foreground">
                  After purchase: {coins - purchasingReward.cost} coins remaining
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase} className="gap-2">
              <Coins className="w-4 h-4" />
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
