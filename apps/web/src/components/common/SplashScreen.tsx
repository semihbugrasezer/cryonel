import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 4000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simple progress animation without heavy effects
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (duration / 50));
      });
    }, 50);

    // Hide splash after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Simplified background - no heavy blur effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-slate-500/5 to-transparent rounded-full" />
      </div>

      <div className="text-center relative z-10 animate-fade-in">
        {/* Simplified Logo Container */}
        <div className="mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 animate-bounce-in">
            <img src="/cryonel_logo_cube.svg" alt="CRYONEL 3D Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
        </div>

        {/* Text */}
        <div className="animate-slide-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-orange-600 to-slate-800 dark:from-slate-200 dark:via-orange-500 dark:to-slate-200 bg-clip-text text-transparent mb-4">
            CRYONEL
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl mb-8 font-medium">
            Algorithmic Trading Reimagined
          </p>
        </div>

        {/* Simple Progress bar */}
        <div className="w-64 sm:w-80 h-2 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-6 animate-pulse font-medium">
          Initializing trading systems...
        </p>
      </div>
    </div>
  );
}