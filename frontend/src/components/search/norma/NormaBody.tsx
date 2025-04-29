// components/norma/NormaBody.tsx
export function NormaBody({ html }: { html: string }) {
  return html ? (
    <article
      className='prose prose-lg max-w-none'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <p className='text-muted-foreground'>No hay contenido disponible.</p>
  );
}
