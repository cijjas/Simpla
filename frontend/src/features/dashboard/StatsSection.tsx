'use client';
import { useEffect, useState } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ListOrdered } from 'lucide-react';
import { GraphCard } from './GraphCard';

// register needed chart.js elements once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface Overview {
  total_normas: number;
  total_relaciones: number;
}

interface TopModifier {
  id_norma: string;
  tipo: string;
  numero: string;
  total_modifica: number;
  titulo?: string;
}

interface CountByLabel {
  label: string | number;
  count: number;
}

export function StatsSection() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [perType, setPerType] = useState<CountByLabel[]>([]);
  const [perYear, setPerYear] = useState<CountByLabel[]>([]);
  const [untouched, setUntouched] = useState<{
    intactas: number;
    modificadas: number;
  } | null>(null);
  const [avgMods, setAvgMods] = useState<{ tipo: string; avg_mods: number }[]>(
    [],
  );
  const [modsPerYear, setModsPerYear] = useState<CountByLabel[]>([]);
  const [topModifiers, setTopModifiers] = useState<TopModifier[]>([]);

  /* fetch once on mount -------------------------------------------------- */
  useEffect(() => {
    async function load() {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      const [ov, pt, py, un, avg, mpy, tm] = await Promise.all([
        safeFetch(`${baseUrl}/api/stats/overview`),
        safeFetch(`${baseUrl}/api/stats/normas-per-type`),
        safeFetch(`${baseUrl}/api/stats/normas-per-year`),
        safeFetch(`${baseUrl}/api/stats/untouched-vs-modified`),
        safeFetch(`${baseUrl}/api/stats/avg-mods-per-type`),
        safeFetch(`${baseUrl}/api/stats/modificaciones-per-year`),
        safeFetch(`${baseUrl}/api/stats/top-modifiers?limit=5`),
      ]);

      setOverview(ov);
      setPerType(pt ?? []);
      setPerYear(py ?? []);
      setUntouched(un);
      setAvgMods(avg ?? []);
      setModsPerYear(mpy ?? []);
      setTopModifiers(tm ?? []);
    }
    load();
  }, [baseUrl]);

  /* chart helpers -------------------------------------------------------- */
  const palette = [
    '#23395d',
    '#2e4a7d',
    '#3a5b9d',
    '#457dbd',
    '#509edf',
    '#5bc0ff',
    '#7bcbff',
    '#9ad6ff',
    '#b9e1ff',
    '#d8ecff',
  ];

  const pieTipoData = {
    labels: perType.map(d => d.label),
    datasets: [{ data: perType.map(d => d.count), backgroundColor: palette }],
  };

  const barAnioData = {
    labels: perYear.map(d => d.label),
    datasets: [
      {
        label: 'Normas',
        data: perYear.map(d => d.count),
        backgroundColor: palette,
      },
    ],
  };

  const pieUntouchedData = untouched && {
    labels: ['Intactas', 'Modificadas'],
    datasets: [
      {
        data: [untouched.intactas, untouched.modificadas],
        backgroundColor: ['#3a5b9d', '#e11d48'],
      },
    ],
  };

  const barAvgModsData = {
    labels: avgMods.map(d => d.tipo),
    datasets: [
      {
        label: 'Promedio de modificaciones',
        data: avgMods.map(d => d.avg_mods),
        backgroundColor: palette,
      },
    ],
  };

  const barModsPerYearData = {
    labels: modsPerYear.map(d => d.label),
    datasets: [
      {
        label: 'Modificaciones emitidas',
        data: modsPerYear.map(d => d.count),
        backgroundColor: palette,
      },
    ],
  };

  if (
    !overview ||
    !untouched ||
    perType.length === 0 ||
    perYear.length === 0 ||
    avgMods.length === 0 ||
    modsPerYear.length === 0 ||
    topModifiers.length === 0
  ) {
    return null;
  }

  return (
    <section className='grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-16'>
      {/* KPI cards -------------------------------------------------------- */}
      <GraphCard
        title='Total de Normas'
        subtitle='Cantidad acumulada en la base'
        value={overview?.total_normas ?? '…'}
      />
      <GraphCard
        title='Total de Relaciones'
        subtitle='Enmiendas registradas'
        value={overview?.total_relaciones ?? '…'}
      />
      <GraphCard
        title='% de Normas sin modificar'
        subtitle='Estabilidad vs. cambio'
        value={
          untouched
            ? `${(
                (untouched.intactas /
                  (untouched.intactas + untouched.modificadas)) *
                100
              ).toFixed(1)} %`
            : '…'
        }
        graph={untouched ? <Pie data={pieUntouchedData!} /> : undefined}
      />

      {/* Charts ----------------------------------------------------------- */}
      <GraphCard
        title='Normas por Tipo'
        subtitle='Distribución actual'
        graph={<Pie data={pieTipoData} />}
      />
      <GraphCard
        title='Normas por Año'
        subtitle='Producción legislativa'
        graph={<Bar data={barAnioData} />}
      />
      <GraphCard
        title='Modificaciones por Año'
        subtitle='Actividad de reforma'
        graph={<Bar data={barModsPerYearData} />}
      />
      <GraphCard
        title='Promedio de modificaciones por Tipo'
        subtitle='Volatilidad relativa'
        graph={<Bar data={barAvgModsData} />}
      />

      {/* Top‑5 list -------------------------------------------------------- */}
      <GraphCard
        title='Top 5 normas que más modifican'
        subtitle='Impacto regulatorio'
        graph={
          <ul className='text-sm mt-2 space-y-1 max-h-48 overflow-y-auto pr-2'>
            {topModifiers.length === 0
              ? '…'
              : topModifiers.map(n => (
                  <li key={n.id_norma} className='flex items-start gap-2'>
                    <ListOrdered className='h-4 w-4 shrink-0 mt-1 text-slate-500' />
                    <div>
                      <span className='font-medium'>
                        {n.tipo} {n.numero}
                      </span>{' '}
                      <span className='text-slate-600'>
                        ({n.total_modifica})
                      </span>
                      <br />
                      <span className='text-xs text-slate-500'>
                        {n.titulo?.slice(0, 80) || 'Sin título'}
                      </span>
                    </div>
                  </li>
                ))}
          </ul>
        }
      />
    </section>
  );
}
