'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import SvgEstampa from '@/../public/svgs/estampa.svg';

interface TextSelectionTooltipProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAskThemis: (selectedText: string) => void;
}

export function TextSelectionTooltip({ 
  containerRef, 
  onAskThemis 
}: TextSelectionTooltipProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Clear any existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Debounce the selection handling to let user finish selecting
      debounceTimeout.current = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        // Only show tooltip if:
        // 1. Text is selected (not empty)
        // 2. Selection is within our container
        // 3. Text has meaningful length (more than 3 chars)
        if (
          text.length > 3 && 
          selection && 
          selection.rangeCount > 0 &&
          containerRef.current
        ) {
          const range = selection.getRangeAt(0);
          const selectionRect = range.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          // Check if selection is within container bounds
          const isWithinContainer = 
            selectionRect.top >= containerRect.top &&
            selectionRect.bottom <= containerRect.bottom &&
            selectionRect.left >= containerRect.left &&
            selectionRect.right <= containerRect.right;

          if (isWithinContainer) {
            setSelectedText(text);

            // Calculate tooltip position relative to the viewport
            // Position above the selection, centered horizontally
            const tooltipWidth = 180; // Approximate width of tooltip
            const tooltipHeight = 48; // Approximate height of tooltip
            const spacing = 8; // Space between selection and tooltip

            // Calculate left position (centered on selection)
            let left = selectionRect.left + (selectionRect.width / 2) - (tooltipWidth / 2);
            
            // Ensure tooltip doesn't go off-screen horizontally
            const viewportWidth = window.innerWidth;
            if (left < 8) left = 8;
            if (left + tooltipWidth > viewportWidth - 8) {
              left = viewportWidth - tooltipWidth - 8;
            }

            // Calculate top position (above selection)
            let top = selectionRect.top - tooltipHeight - spacing;
            
            // If tooltip would be above viewport, show below selection instead
            if (top < 8) {
              top = selectionRect.bottom + spacing;
            }

            setPosition({ top, left });
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          setIsVisible(false);
        }
      }, 300); // 300ms debounce delay
    };

    // Listen to selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also listen to mouseup events for more immediate feedback
    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 50);
    };
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [containerRef]);

  // Hide tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node)
      ) {
        // Small delay to allow the button click to register
        setTimeout(() => {
          setIsVisible(false);
        }, 100);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const handleAskClick = () => {
    onAskThemis(selectedText);
    setIsVisible(false);
    // Clear the selection
    window.getSelection()?.removeAllRanges();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Button
        onClick={handleAskClick}
        size="sm"
        className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow rounded-lg px-3 py-2 h-auto"
      >
        <SvgEstampa 
          className="h-4 w-4 flex-shrink-0" 
          fill="currentColor"
        />
        <span className="whitespace-nowrap">  
                Preguntale a {' '}
                <span className="font-serif font-thin italic">Themis</span>
              </span>
      </Button>
    </div>
  );
}

