'use client';

import { MarkdownContent } from './markdown-content';

export function PrivacyPage() {
  return (
    <section className='py-20 bg-background'>
      <div className='mx-auto max-w-4xl px-6'>
        <div className='prose prose-lg prose-gray max-w-none'>
          <MarkdownContent filePath="/privacidad/simpla-politica-de-privacidad.md" />
        </div>
      </div>
    </section>
  );
}
