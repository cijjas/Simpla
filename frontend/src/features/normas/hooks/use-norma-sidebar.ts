'use client';

import { useState, useEffect, useRef } from 'react';

export function useNormaSidebar(hasDivisions: boolean) {
  const [activeDivisionId, setActiveDivisionId] = useState<number | null>(null);
  const divisionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!hasDivisions) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
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
      const offset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
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
