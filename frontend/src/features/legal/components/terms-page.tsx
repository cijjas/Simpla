'use client';

import { memo } from 'react';
import { MarkdownContent } from './markdown-content';

export const TermsPage = memo(function TermsPage() {
  return (
    <section className='py-20 bg-background'>
      <div className='mx-auto max-w-4xl px-6'>
        <div className='prose prose-lg prose-gray max-w-none'>
          <MarkdownContent filePath="/terminos/simpla-terms-of-service.md" />
        </div>
      </div>
    </section>
  );
});
