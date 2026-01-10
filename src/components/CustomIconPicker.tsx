import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePremiumFeatures, PREMIUM_ICONS } from '@/hooks/usePremiumFeatures';
import { cn } from '@/lib/utils';

interface CustomIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  standardIcons: string[];
}

export default function CustomIconPicker({ 
  selectedIcon, 
  onSelectIcon,
  standardIcons 
}: CustomIconPickerProps) {
  const { hasCustomIcons } = usePremiumFeatures();

  return (
    <div className="space-y-3">
      {/* Standard Icons */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Standard Icons</div>
        <div className="flex flex-wrap gap-2">
          {standardIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => onSelectIcon(icon)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
                selectedIcon === icon 
                  ? 'bg-primary/10 ring-2 ring-primary' 
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Premium Icons */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Premium Icons</span>
          {hasCustomIcons && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              Unlocked
            </span>
          )}
        </div>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {PREMIUM_ICONS.slice(0, 20).map((icon, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    onClick={() => hasCustomIcons && onSelectIcon(icon)}
                    disabled={!hasCustomIcons}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all relative",
                      hasCustomIcons 
                        ? selectedIcon === icon 
                          ? 'bg-primary/10 ring-2 ring-primary' 
                          : 'bg-secondary hover:bg-secondary/80'
                        : 'bg-muted/50 cursor-not-allowed opacity-60'
                    )}
                    whileHover={hasCustomIcons ? { scale: 1.1 } : {}}
                    whileTap={hasCustomIcons ? { scale: 0.95 } : {}}
                  >
                    {hasCustomIcons ? (
                      icon
                    ) : (
                      <>
                        <span className="blur-[2px]">{icon}</span>
                        <Lock className="w-3 h-3 absolute text-muted-foreground" />
                      </>
                    )}
                  </motion.button>
                </TooltipTrigger>
                {!hasCustomIcons && (
                  <TooltipContent>
                    <p>Unlock Custom Icons Pack from the Shop</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        
        {/* More premium icons when unlocked */}
        {hasCustomIcons && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            <div className="flex flex-wrap gap-2">
              {PREMIUM_ICONS.slice(20).map((icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectIcon(icon)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
                    selectedIcon === icon 
                      ? 'bg-primary/10 ring-2 ring-primary' 
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
