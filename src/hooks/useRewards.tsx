import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

      // Deduct coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: profile.coins - reward.cost })
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

      return reward;
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user_rewards'] });
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