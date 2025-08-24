import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { mode, actualTheme, toggleMode } = useThemeStore();

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-slate-300" />;
      case 'auto':
        return <Monitor className="h-4 w-4 text-blue-500" />;
      default:
        return <Sun className="h-4 w-4 text-amber-500" />;
    }
  };

  const getTooltip = () => {
    switch (mode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'auto':
        return `Auto mode (${actualTheme})`;
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMode}
      className="relative w-9 h-9 p-0 rounded-full border border-border/40 hover:border-border bg-background/10 backdrop-blur-sm hover:bg-background/20 transition-all duration-200"
      title={getTooltip()}
    >
      <motion.div
        className="flex items-center justify-center"
        initial={false}
        animate={{
          scale: 1,
          rotate: 0,
        }}
        key={mode} // Force re-render on mode change
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {getIcon()}
      </motion.div>
      
      <span className="sr-only">{getTooltip()}</span>
    </Button>
  );
}