import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Streak freeze values for different reward types
const STREAK_FREEZE_VALUES: Record<string, number> = {
  '2474c8d8-6b0f-4f78-a0ae-3c3779fbbb0d': 1, // Streak Freeze (1 Day)
  '3086eea6-ccf0-430e-8ebc-fee11f87abef': 1, // Streak Freeze (1 Day)
  'f8639bcd-bbc7-407c-9340-e5cbd41be893': 3, // Streak Freeze (3 Days)
  'b1033be8-b607-4cb0-8f29-d2f2e31dc1ac': 7, // Streak Freeze (Week)
  '0abc4974-93cb-4d08-9260-a0d2d43cad8e': 3, // Extended Freeze (3 days)
  'b2155de2-568b-4345-8258-99b0a5fb0e23': 7, // Extended Freeze (7 days)
};

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: 'badge' | 'theme' | 'streak_freeze';
  icon: string | null;
  cost: number;
  is_active: boolean;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  quantity: number;
  purchased_at: string;
  reward?: Reward;
}

export function useRewards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true });
      
      if (error) throw error;
      return data as Reward[];
    },
  });

  const { data: userRewards = [], isLoading: userRewardsLoading } = useQuery({
    queryKey: ['user_rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*, reward:rewards(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserReward[];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const purchaseReward = useMutation({
    mutationFn: async (reward: Reward) => {
      if (!user) throw new Error('Not authenticated');
      if (!profile || profile.coins < reward.cost) {
        throw new Error('Insufficient coins');
      }

      // Check if user already owns this reward (for badges/themes)
      const existingReward = userRewards.find(ur => ur.reward_id === reward.id);
      
      if (reward.type !== 'streak_freeze' && existingReward) {
        throw new Error('You already own this reward');
      }

      // Re-fetch current coin balance to prevent race conditions
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();
      
      if (!currentProfile || currentProfile.coins < reward.cost) {
        throw new Error('Insufficient coins');
      }

      // Deduct coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: currentProfile.coins - reward.cost })
        .eq('id', user.id);
      
      if (updateError) throw updateError;

      // Record transaction
      await supabase.from('coin_transactions').insert([{
        user_id: user.id,
        amount: -reward.cost,
        type: 'spend',
        reason: `Purchased ${reward.name}`
      }]);

      // Add to user rewards or increment quantity
      if (existingReward) {
        const { error } = await supabase
          .from('user_rewards')
          .update({ quantity: existingReward.quantity + 1 })
          .eq('id', existingReward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_rewards')
          .insert([{ user_id: user.id, reward_id: reward.id }]);
        if (error) throw error;
      }

      // For streak freezes, add to user_settings
      if (reward.type === 'streak_freeze') {
        const freezeDays = STREAK_FREEZE_VALUES[reward.id] || 1;
        
        // Get or create user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (settings) {
          await supabase
            .from('user_settings')
            .update({ streak_freezes_remaining: settings.streak_freezes_remaining + freezeDays })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_settings')
            .insert([{ user_id: user.id, streak_freezes_remaining: freezeDays }]);
        }
      }

      return reward;
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user_rewards'] });
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      toast.success(`Purchased ${reward.name}! 🎉`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const hasReward = (rewardId: string) => {
    return userRewards.some(ur => ur.reward_id === rewardId);
  };

  const getRewardQuantity = (rewardId: string) => {
    const ur = userRewards.find(r => r.reward_id === rewardId);
    return ur?.quantity || 0;
  };

  return {
    rewards,
    userRewards,
    profile,
    isLoading: rewardsLoading || userRewardsLoading,
    purchaseReward,
    hasReward,
    getRewardQuantity,
  };
}