import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Palette, 
  Shield, 
  Bell, 
  Download,
  LogOut,
  Mail,
  Sparkles,
  Check,
  AlertTriangle,
  ChevronRight,
  Coins
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings, THEME_CONFIGS } from '@/hooks/useUserSettings';
import { useRewards } from '@/hooks/useRewards';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings, applyTheme, resetToDefault } = useUserSettings();
  const { profile, hasReward } = useRewards();
  const { 
    hasWeeklyReports, 
    hasAnalyticsPro, 
    hasCustomIcons,
    weeklyReportsEnabled,
    toggleWeeklyReports 
  } = usePremiumFeatures();
  
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/settings`,
      }
    });
    if (error) {
      toast.error(error.message);
    }
  };

  const isGoogleUser = user?.app_metadata?.provider === 'google';
  const userEmail = user?.email || '';

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account
                </CardTitle>
                <CardDescription>
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{userEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        {isGoogleUser ? 'Connected with Google' : 'Email account'}
                      </p>
                    </div>
                  </div>
                  {isGoogleUser && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      Google
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="max-w-xs"
                    />
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      size="sm"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Google Connect */}
                {!isGoogleUser && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Connect Google Account</p>
                        <p className="text-sm text-muted-foreground">
                          Link your Google account for easier sign in
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleGoogleSignIn}>
                      Connect
                    </Button>
                  </div>
                )}

                {/* Coins */}
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <div>
                      <p className="font-medium">Coin Balance</p>
                      <p className="text-sm text-muted-foreground">
                        Spend coins in the Rewards Shop
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {profile?.coins || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Premium Features
                </CardTitle>
                <CardDescription>
                  Your unlocked premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weekly Reports */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Weekly Reports</p>
                        {hasWeeklyReports ? (
                          <Badge className="bg-primary/20 text-primary text-xs">Unlocked</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Locked</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasWeeklyReports 
                          ? 'Receive weekly habit summaries via email'
                          : 'Unlock in the Rewards Shop for 1000 coins'}
                      </p>
                    </div>
                  </div>
                  {hasWeeklyReports ? (
                    <Switch 
                      checked={weeklyReportsEnabled} 
                      onCheckedChange={toggleWeeklyReports}
                    />
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => navigate('/rewards')}>
                      Unlock
                    </Button>
                  )}
                </div>

                {/* Analytics Pro */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-accent" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Analytics Pro</p>
                        {hasAnalyticsPro ? (
                          <Badge className="bg-accent/20 text-accent text-xs">Unlocked</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Locked</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasAnalyticsPro 
                          ? 'Advanced habit analytics and insights'
                          : 'Unlock in the Rewards Shop for 2000 coins'}
                      </p>
                    </div>
                  </div>
                  {!hasAnalyticsPro && (
                    <Button size="sm" variant="outline" onClick={() => navigate('/rewards')}>
                      Unlock
                    </Button>
                  )}
                </div>

                {/* Custom Icons */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-streak" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Custom Icon Pack</p>
                        {hasCustomIcons ? (
                          <Badge className="bg-streak/20 text-streak text-xs">Unlocked</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Locked</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasCustomIcons 
                          ? '50+ premium habit icons available'
                          : 'Unlock in the Rewards Shop for 1500 coins'}
                      </p>
                    </div>
                  </div>
                  {!hasCustomIcons && (
                    <Button size="sm" variant="outline" onClick={() => navigate('/rewards')}>
                      Unlock
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how Habitflow looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.active_theme_id && THEME_CONFIGS[settings.active_theme_id] 
                        ? THEME_CONFIGS[settings.active_theme_id].name 
                        : 'Default'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/rewards')}>
                      Browse Themes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetToDefault}>
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Developer / Testing Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="w-5 h-5" />
                  Developer Mode
                </CardTitle>
                <CardDescription>
                  Testing utilities (non-production)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ coins: 10000 })
                        .eq('id', user.id);
                      if (error) throw error;
                      toast.success('Coins set to 10,000 for testing!');
                      window.location.reload();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Add 10,000 Test Coins
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-destructive/30">
              <CardContent className="py-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
