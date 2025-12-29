import { useState, useRef, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export function PullToRefresh({ children, onRefresh, isRefreshing = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      const resistance = 0.4;
      setPullDistance(Math.min(diff * resistance, threshold * 1.5));
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, onRefresh, isRefreshing]);

  const showIndicator = pullDistance > 0 || isRefreshing;
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 180;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showIndicator && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-all duration-200 md:hidden"
          style={{ 
            top: Math.max(pullDistance - 40, 8),
            opacity: isRefreshing ? 1 : indicatorOpacity 
          }}
        >
          <div className="bg-white rounded-full p-2 shadow-md">
            <Loader2 
              className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: isRefreshing ? undefined : `rotate(${rotation}deg)` }}
            />
          </div>
        </div>
      )}
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
