'use client';

import { PaperTexture } from '@paper-design/shaders-react';
import { useEffect, useRef, useState } from 'react';

export function PaperBackground() {
  const [paperBackground, setPaperBackground] = useState<string>('');
  const [isDark, setIsDark] = useState(false);
  const [seed] = useState(() => Math.random() * 1000);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a larger texture with varied seed
    const generateTexture = () => {
      if (paperRef.current) {
        const canvas = paperRef.current.querySelector('canvas');
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          setPaperBackground(dataUrl);
        }
      }
    };

    const timer = setTimeout(generateTexture, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Detect dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Single larger PaperTexture with varied seed */}
      <div ref={paperRef} className="absolute opacity-0 pointer-events-none">
        <PaperTexture
          width={1024}
          height={1024}
          colorBack="#FFFFFF"
          colorFront="#000000"
          contrast={0.26}
          roughness={0.51}
          fiber={0.26}
          fiberSize={0.15}
          crumples={0.16}
          crumpleSize={0.31}
          folds={0.14}
          foldCount={12}
          drops={0.06}
          fade={0.55}
          seed={seed}
          scale={0.5}
        />
      </div>

      {/* Repeating paper texture background */}
      {paperBackground && (
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none z-3 dark:invert"
          style={{
            backgroundImage: `url(${paperBackground})`,
            backgroundSize: '1024px 1024px',
            backgroundRepeat: 'repeat',
            opacity: isDark ? 0.8 : 0.3,
            mixBlendMode: isDark ? 'overlay' : 'multiply',
          }}
        />
      )}
    </>
  );
}
