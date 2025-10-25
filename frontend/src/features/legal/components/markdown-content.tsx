'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';

interface MarkdownContentProps {
  filePath: string;
}

export function MarkdownContent({ filePath }: MarkdownContentProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando contenido...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Error al cargar el contenido
        </h3>
        <p className="text-sm text-destructive/80">{error}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Asegúrate de que el archivo {filePath} existe en la carpeta public.
        </p>
      </div>
    );
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for better styling
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 mt-8 first:mt-0 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium mb-3 mt-6 text-gray-700">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-6 leading-relaxed text-gray-700 text-base text-justify">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-6 ml-6 list-disc space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 ml-6 list-decimal space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-gray-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-200 pl-6 my-6 italic text-gray-600 bg-blue-50 py-4 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (language) {
              return (
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto my-4">
                  <code className={`language-${language} text-sm`}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              );
            }
            
            return (
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-8">
              <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-6 py-3 bg-gray-50 font-semibold text-left text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-6 py-3 text-gray-700">{children}</td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
