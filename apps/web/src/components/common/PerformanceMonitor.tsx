import { useState, useEffect } from 'react';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const measurePerformance = () => {
      // Get performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;
      
      // Measure FID (simplified)
      let fid = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            fid = (entry as PerformanceEventTiming).processingStart - (entry as PerformanceEventTiming).startTime;
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });

      // Measure CLS (simplified)
      let cls = 0;
      const layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const layoutShift = entry as any;
            if (!layoutShift.hadRecentInput) {
              cls += layoutShift.value;
            }
          }
        }
      });
      layoutObserver.observe({ entryTypes: ['layout-shift'] });

      const ttfb = navigation.responseStart - navigation.requestStart;

      setMetrics({
        fcp: Math.round(fcp),
        lcp: Math.round(lcp),
        fid: Math.round(fid),
        cls: Math.round(cls * 1000) / 1000,
        ttfb: Math.round(ttfb),
      });
    };

    // Wait for page to load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getScore = (metric: keyof PerformanceMetrics, value: number): { score: number; color: string } => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return { score: 0, color: 'text-gray-500' };

    let score: number;
    if (metric === 'cls') {
      // CLS is lower = better
      score = value <= threshold.good ? 100 : value <= threshold.poor ? 50 : 0;
    } else {
      // Other metrics are lower = better
      score = value <= threshold.good ? 100 : value <= threshold.poor ? 50 : 0;
    }

    const color = score >= 90 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
    return { score, color };
  };

  if (!metrics) {
    return (
      <div className="fixed bottom-4 right-4 bg-surf-0 border border-border rounded-lg p-3 shadow-lg z-50">
        <div className="flex items-center gap-2 text-sm text-text-low">
          <Activity className="h-4 w-4 animate-pulse" />
          Measuring performance...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-surf-0 border border-border rounded-lg p-4 shadow-lg z-50 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Performance</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-text-low">FCP</span>
          <span className={getScore('fcp', metrics.fcp).color}>
            {metrics.fcp}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-text-low">LCP</span>
          <span className={getScore('lcp', metrics.lcp).color}>
            {metrics.lcp}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-text-low">FID</span>
          <span className={getScore('fid', metrics.fid).color}>
            {metrics.fid}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-text-low">CLS</span>
          <span className={getScore('cls', metrics.cls).color}>
            {metrics.cls}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-text-low">TTFB</span>
          <span className={getScore('ttfb', metrics.ttfb).color}>
            {metrics.ttfb}ms
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-text-low">
          <TrendingUp className="h-3 w-3" />
          <span>Core Web Vitals</span>
        </div>
      </div>
    </div>
  );
}
