import { useState, useEffect, useRef } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounce?: number;
}

export function useScrollDirection({
  threshold = 10,
  debounce = 10,
}: UseScrollDirectionOptions = {}) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const atTop = scrollY < threshold;

      // Always update isAtTop
      setIsAtTop(atTop);

      // Only update direction if there's significant movement
      if (Math.abs(scrollY - lastScrollY.current) > threshold) {
        const direction = scrollY > lastScrollY.current ? 'down' : 'up';
        
        // Temporary debug logging
        console.log('Scroll:', { scrollY, lastScrollY: lastScrollY.current, direction, atTop });
        
        setScrollDirection(direction);
        lastScrollY.current = scrollY;
      }
    };

    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollDirection, debounce);
    };

    // Set initial values
    lastScrollY.current = window.scrollY;
    setIsAtTop(window.scrollY < threshold);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeoutId);
    };
  }, [threshold, debounce]);

  return { scrollDirection, isAtTop };
}
