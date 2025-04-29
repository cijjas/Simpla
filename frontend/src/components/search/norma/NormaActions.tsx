// components/norma/NormaActions.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Copy, Download, Share2 } from 'lucide-react';
import { useState } from 'react';

export function NormaActions({ copyText }: { copyText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='flex gap-2'>
      <Button size='icon' variant='outline' onClick={handleCopy}>
        {copied ? (
          <span className='text-xs'>✓</span>
        ) : (
          <Copy className='h-4 w-4' />
        )}
      </Button>
      <Button size='icon' variant='outline' disabled>
        <Download className='h-4 w-4' />
      </Button>
      <Button size='icon' variant='outline' disabled>
        <Share2 className='h-4 w-4' />
      </Button>
    </div>
  );
}
