'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function NormaBody({ originalHtml = '' }: { originalHtml?: string }) {
  const cleanHtml = DOMPurify.sanitize(originalHtml.trim());

  if (!cleanHtml) {
    return (
      <Alert variant='default' className='my-6'>
        <Info className='h-4 w-4' />
        <AlertTitle>Sin cuerpo disponible</AlertTitle>
        <AlertDescription>
          Esta norma no contiene un cuerpo textual adicional.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className='prose max-w-none text-gray-700 dark:text-slate-300'
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
