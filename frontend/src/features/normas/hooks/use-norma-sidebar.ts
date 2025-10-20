'use client';

import { useState, useEffect, useRef } from 'react';

export function useNormaSidebar(hasDivisions: boolean) {
  const [activeDivisionId, setActiveDivisionId] = useState<number | null>(null);
  const divisionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Use consistent offset for both scrolling and detection
  const SCROLL_OFFSET = 150;

  useEffect(() => {
    if (!hasDivisions) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + SCROLL_OFFSET;
      let currentDivision: number | null = null;

      divisionRefs.current.forEach((element, divisionId) => {
        const rect = element.getBoundingClientRect();
        const offsetTop = window.scrollY + rect.top;

        if (offsetTop <= scrollPosition) {
          currentDivision = divisionId;
        }
      });

      setActiveDivisionId(currentDivision);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDivisions]);

  const scrollToDivision = (divisionId: number) => {
    const element = divisionRefs.current.get(divisionId);
    if (element) {
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - SCROLL_OFFSET,
        behavior: 'smooth',
      });
    }
  };

  return {
    activeDivisionId,
    divisionRefs,
    scrollToDivision,
  };
}
