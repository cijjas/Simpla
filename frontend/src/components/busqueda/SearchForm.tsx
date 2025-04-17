'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { debounce } from '@/lib/utils';
import { decode } from 'html-entities';

type Props = {
  onSubmit: (params: URLSearchParams) => void;
};

export default function SearchForm({ onSubmit }: Props) {
  // State for search parameters and input fields
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());

  // Input fields
  const [temaQuery, setTemaQuery] = useState('');
  const [temaSuggestions, setTemaSuggestions] = useState<string[]>([]);
  const suppressFetch = useRef(false); // Prevent triggering fetch on programmatic input changes

  const [numeroNorma, setNumeroNorma] = useState('');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [idDoc, setIdDoc] = useState('');

  // High-level filters
  const [tipoContenido, setTipoContenido] = useState('Legislación');
  const [tipoNorma, setTipoNorma] = useState('');
  const [estadoVigencia, setEstadoVigencia] = useState('');

  // Autocomplete: Fetch suggestions when `temaQuery` changes
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
      const json = await res.json();

      const suggestions = (Array.isArray(json) ? json : []).map(
        item => item.suggestion,
      );
      setTemaSuggestions(suggestions);
    }, 300);

    handler();
    return () => handler.cancel?.();
  }, [temaQuery]);

  // helper to update params
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ----- build “f” (facets) -----
    const facetParts: string[] = ['Total'];
    if (tipoContenido === 'Legislación' && !tipoNorma) {
      facetParts.push('Tipo de Documento/Legislación');
    } else {
      facetParts.push(
        `Tipo de Documento/${tipoContenido}${tipoNorma ? '/' + tipoNorma : ''}`,
      );
    }
    facetParts.push(
      'Fecha',
      'Organismo',
      'Publicación',
      'Tema',
      'Estado de Vigencia',
      'Autor',
    );
    if (params.get('jurisdiccion')) {
      facetParts.push(`Jurisdicción/${params.get('jurisdiccion')}`);
    } else {
      facetParts.push('Jurisdicción');
    }
    const fParam = facetParts.join('|');

    // ----- build “r” (search expression) -----
    const rParts: string[] = [];
    if (numeroNorma) rParts.push(`(numero-norma:${numeroNorma} )`);
    if (titulo)
      titulo
        .trim()
        .split(/\s+/)
        .forEach(word => rParts.push(`titulo: ${word}`));
    if (temaQuery) rParts.push(`tema:${encodeURIComponent(temaQuery)}`);
    if (fechaDesde || fechaHasta) {
      const from = (fechaDesde || '').replaceAll('/', '');
      const to = (fechaHasta || '').replaceAll('/', '');
      rParts.push(`fecha-rango:[${from || '*'} TO ${to || '*'}]`);
    }
    if (texto) rParts.push(`texto: ${texto}`);
    if (idDoc) rParts.push(`(id-infojus:${idDoc})`);
    const rParam = rParts.join(' AND ');

    // ----- assemble final URL -----
    const searchParams = new URLSearchParams();
    if (rParam) searchParams.set('r', rParam);
    searchParams.set('o', '0');
    searchParams.set('p', '25');
    searchParams.set('f', fParam);
    searchParams.set('s', '');
    searchParams.set('v', 'colapsada');

    // Pass only the params — fetching is handled in ResultsList
    onSubmit(searchParams);
  };

  return (
    <Card className='p-6 space-y-4 w-full md:w-80'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Tipo de Contenido */}
        <div>
          <label className='block text-sm font-medium mb-1'>
            Tipo de Contenido
          </label>
          <Select
            defaultValue='Legislación'
            onValueChange={v => {
              setTipoContenido(v);
              set('tipo-contenido', v); // keep in params for consistency
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'Legislación',
                'Fallo',
                'Sumario',
                'Dictamen',
                'Doctrina',
                'Todo',
              ].map(t => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo Norma */}
        <div>
          <label className='block text-sm font-medium mb-1'>Tipo Norma</label>
          <Select
            value={tipoNorma || undefined}
            onValueChange={v => {
              setTipoNorma(v);
              set('tipo-norma', v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder='Buscar en toda la legislación…' />
            </SelectTrigger>
            <SelectContent>
              {[
                'Ley',
                'Decreto',
                'Decisión',
                'Resolución',
                'Disposición',
                'Acordada',
              ].map(t => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Número Norma */}
        <Input
          placeholder='Número Norma'
          value={numeroNorma}
          onChange={e => {
            setNumeroNorma(e.target.value);
            set('numero-norma', e.target.value);
          }}
        />

        {/* Jurisdicción */}
        <div>
          <label className='block text-sm font-medium mb-1'>Jurisdicción</label>
          <Select
            onValueChange={v => set('jurisdiccion', v === '__all__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Todas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__all__'>Todas</SelectItem>
              <SelectItem value='Nacional'>Nacional</SelectItem>
              <SelectItem value='Internacional'>Internacional</SelectItem>
              <SelectItem value='__provincial-header__' disabled>
                Provincial
              </SelectItem>{' '}
              {[
                'Local/Buenos Aires',
                'Local/Catamarca',
                'Local/Ciudad Autónoma de Buenos Aires',
                'Local/Chaco',
                'Local/Chubut',
                'Local/Corrientes',
                'Local/Córdoba',
                'Local/Entre Ríos',
                'Local/Formosa',
                'Local/Jujuy',
                'Local/La Pampa',
                'Local/La Rioja',
                'Local/Mendoza',
                'Local/Misiones',
                'Local/Neuquén',
                'Local/Río Negro',
                'Local/Salta',
                'Local/Santa Fe',
                'Local/San Juan',
                'Local/San Luis',
                'Local/Santa Cruz',
                'Local/Santiago del Estero',
                'Local/Tierra del Fuego',
                'Local/Tucumán',
              ].map(p => (
                <SelectItem key={p} value={p}>
                  {'-- ' + p.split('/')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado de vigencia (solo Legislación) */}
        {tipoContenido === 'Legislación' && (
          <div>
            <label className='block text-sm font-medium mb-1'>
              Estado de vigencia
            </label>
            <Select
              onValueChange={v => {
                const clean = v === '__all__' ? '' : v;
                setEstadoVigencia(clean);
                set('estado-vigencia', clean);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Todos' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key='__all__' value='__all__'>
                  Todos
                </SelectItem>
                {[
                  'Vigente, de alcance general',
                  'Individual, Solo Modificatoria o Sin Eficacia',
                  'Vetada',
                  'Derogada',
                  'No vigente, abrogada implícitamente',
                  'No vigente, ley caduca',
                  'Refundida, ley caduca',
                ].map(ev => (
                  <SelectItem key={ev} value={ev}>
                    {ev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Título */}
        <Input
          placeholder='Título'
          value={titulo}
          onChange={e => {
            setTitulo(e.target.value);
            set('titulo', e.target.value);
          }}
        />

        {/* Tema (autocomplete) */}
        <div className='relative'>
          <Input
            placeholder='Tema'
            value={temaQuery}
            onChange={e => {
              setTemaQuery(e.target.value);
              set('tema', e.target.value);
            }}
          />
          {temaSuggestions.length > 0 && (
            <ul className='absolute z-20 bg-white border w-full max-h-48 overflow-auto rounded-md shadow'>
              {temaSuggestions.map(s => (
                <li
                  key={s}
                  className='px-3 py-1 hover:bg-slate-100 cursor-pointer'
                  onClick={() => {
                    suppressFetch.current = true;
                    const plainText = s.replace(/<\/?b>/g, '');
                    setTemaQuery(plainText);
                    set('tema', plainText);
                    setTemaSuggestions([]);
                  }}
                  dangerouslySetInnerHTML={{ __html: s }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Texto libre */}
        <Input
          placeholder='Texto en la Norma'
          value={texto}
          onChange={e => {
            setTexto(e.target.value);
            set('texto', e.target.value);
          }}
        />

        {/* Fechas */}
        <Input
          placeholder='Fecha desde (aaaa ó dd/mm/aaaa)'
          value={fechaDesde}
          onChange={e => {
            setFechaDesde(e.target.value);
            set('fecha-desde', e.target.value);
          }}
        />
        <Input
          placeholder='Fecha hasta (aaaa ó dd/mm/aaaa)'
          value={fechaHasta}
          onChange={e => {
            setFechaHasta(e.target.value);
            set('fecha-hasta', e.target.value);
          }}
        />

        {/* Id‑Doc */}
        <Input
          placeholder='Id‑Doc'
          value={idDoc}
          onChange={e => {
            setIdDoc(e.target.value);
            set('id-doc', e.target.value);
          }}
        />

        <div className='flex justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => {
              setParams(new URLSearchParams());
              setTemaQuery('');
              setNumeroNorma('');
              setTitulo('');
              setTexto('');
              setFechaDesde('');
              setFechaHasta('');
              setIdDoc('');
              setTipoContenido('Legislación');
              setTipoNorma('');
              setEstadoVigencia('');
            }}
          >
            Limpiar
          </Button>
          <Button type='submit'>Buscar</Button>
        </div>
      </form>
    </Card>
  );
}
