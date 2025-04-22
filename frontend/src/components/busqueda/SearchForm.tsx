// frontend/src/components/busqueda/SearchForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils';

type SearchMode =
  | 'Legislación'
  | 'Fallo'
  | 'Sumario'
  | 'Dictamen'
  | 'Doctrina'
  | 'Todo';

type Props = {
  onSubmit: (u: URLSearchParams) => void;
};

type Fallo = {
  caratula: string;
  jurisdiccion: string;
  tribunal: string;
  fechaDesde: string;
  fechaHasta: string;
  idDoc: string;
};

type Sumario = {
  jurisdiccion: string;
  tema: string;
  texto: string;
  fechaDesde: string;
  fechaHasta: string;
  idDoc: string;
};

type Dictamen = {
  organismo: string;
  numero: string;
  tema: string;
  texto: string;
  letra: string;
  tomo: string;
  partes: string;
  fechaDesde: string;
  fechaHasta: string;
  idDoc: string;
};

type Doctrina = {
  titulo: string;
  autor: string;
  tema: string;
  texto: string;
  fechaDesde: string;
  fechaHasta: string;
  idDoc: string;
};

type Todo = {
  contextual: string;
};

type Suggestion = { suggestion: string };

export default function SearchForm({ onSubmit }: Props) {
  const [mode] = useState<SearchMode>('Legislación');

  const [fallo] = useState<Fallo>({
    caratula: '',
    jurisdiccion: '',
    tribunal: '',
    fechaDesde: '',
    fechaHasta: '',
    idDoc: '',
  });

  const [sumario] = useState<Sumario>({
    jurisdiccion: '',
    tema: '',
    texto: '',
    fechaDesde: '',
    fechaHasta: '',
    idDoc: '',
  });

  const [dictamen] = useState<Dictamen>({
    organismo: '',
    numero: '',
    tema: '',
    texto: '',
    letra: '',
    tomo: '',
    partes: '',
    fechaDesde: '',
    fechaHasta: '',
    idDoc: '',
  });

  const [doctrina] = useState<Doctrina>({
    titulo: '',
    autor: '',
    tema: '',
    texto: '',
    fechaDesde: '',
    fechaHasta: '',
    idDoc: '',
  });

  const [todo] = useState<Todo>({ contextual: '' });

  const [temaQuery] = useState<string>('');
  const [, setTemaSuggestions] = useState<string[]>([]);
  const suppressFetch = useRef<boolean>(false);

  useEffect(() => {
    if (!temaQuery) {
      setTemaSuggestions([]);
      return;
    }
    if (suppressFetch.current) {
      suppressFetch.current = false;
      return;
    }
    const handler = debounce(async () => {
      const url = `/api/saij/suggest?key=${encodeURIComponent(
        temaQuery,
      )}&suggesterName=busqueda-global&amount=20`;
      const res = await fetch(url);
      const json: Suggestion[] = await res.json();
      setTemaSuggestions(json.map(i => i.suggestion));
    }, 300);
    handler();
    return () => handler.cancel?.();
  }, [temaQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params =
      mode === 'Legislación'
        ? buildLegislacionParams()
        : mode === 'Fallo'
        ? buildFalloParams(fallo)
        : mode === 'Sumario'
        ? buildSumarioParams(sumario)
        : mode === 'Dictamen'
        ? buildDictamenParams(dictamen)
        : mode === 'Doctrina'
        ? buildDoctrinaParams(doctrina)
        : buildTodoParams(todo);
    onSubmit(params);
  };

  return (
    <Card className='p-6 space-y-4 w-full md:w-80'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* … all your form fields … */}
        <Button type='submit'>Buscar</Button>
      </form>
    </Card>
  );
}

// Helpers, all typed
function buildLegislacionParams(): URLSearchParams {
  const params = new URLSearchParams();
  // … same logic as before …
  return params;
}

function buildFalloParams(f: Fallo): URLSearchParams {
  const params = new URLSearchParams();
  if (f.caratula) params.set('r', `caratula:${f.caratula}`);
  return params;
}

function buildSumarioParams(s: Sumario): URLSearchParams {
  const params = new URLSearchParams();
  if (s.tema) params.set('r', `tema:${s.tema}`);
  return params;
}

function buildDictamenParams(d: Dictamen): URLSearchParams {
  const params = new URLSearchParams();
  if (d.numero) params.set('r', `numero:${d.numero}`);
  return params;
}

function buildDoctrinaParams(d: Doctrina): URLSearchParams {
  const params = new URLSearchParams();
  if (d.autor) params.set('r', `autor:${d.autor}`);
  return params;
}

function buildTodoParams(t: Todo): URLSearchParams {
  const params = new URLSearchParams();
  if (t.contextual) params.set('r', t.contextual);
  return params;
}
