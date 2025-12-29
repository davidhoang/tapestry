import { useState, useRef, useCallback, ReactNode } from "react";
import { Plus, X } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  disabled = false 
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    if (isHorizontalSwipe.current === null) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      const resistance = 0.6;
      setOffsetX(diffX * resistance);
    }
  }, [disabled, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    
    if (offsetX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setOffsetX(0);
    setIsDragging(false);
    isHorizontalSwipe.current = null;
  }, [disabled, offsetX, onSwipeLeft, onSwipeRight]);

  const showRightIndicator = offsetX > 20 && onSwipeRight;
  const showLeftIndicator = offsetX < -20 && onSwipeLeft;
  const rightProgress = Math.min(offsetX / threshold, 1);
  const leftProgress = Math.min(-offsetX / threshold, 1);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {showRightIndicator && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-center bg-green-500 transition-all z-0"
          style={{ 
            width: Math.abs(offsetX),
            opacity: rightProgress 
          }}
        >
          <Plus 
            className="h-6 w-6 text-white" 
            style={{ transform: `scale(${0.5 + rightProgress * 0.5})` }}
          />
        </div>
      )}
      
      {showLeftIndicator && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-all z-0"
          style={{ 
            width: Math.abs(offsetX),
            opacity: leftProgress 
          }}
        >
          <X 
            className="h-6 w-6 text-white" 
            style={{ transform: `scale(${0.5 + leftProgress * 0.5})` }}
          />
        </div>
      )}
      
      <div
        className={`relative z-10 bg-background ${isDragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
