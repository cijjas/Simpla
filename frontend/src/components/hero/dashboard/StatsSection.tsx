'use client';
import { useEffect, useState } from 'react';
import GraphCard from './GraphCard';
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

interface CountByLabel {
  label: string | number;
  count: number;
}

export default function StatsSection() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [overview, setOverview] = useState<any>(null);
  const [perType, setPerType] = useState<CountByLabel[]>([]);
  const [perYear, setPerYear] = useState<CountByLabel[]>([]);

  // fetch once on mount
  useEffect(() => {
    async function load() {
      const [ov, pt, py] = await Promise.all([
        fetch(`${baseUrl}/api/stats/overview`).then(r => r.json()),
        fetch(`${baseUrl}/api/stats/normas-per-type`).then(r => r.json()),
        fetch(`${baseUrl}/api/stats/normas-per-year`).then(r => r.json()),
      ]);
      setOverview(ov);
      setPerType(pt);
      setPerYear(py);
    }
    load();
  }, [baseUrl]);

  // chart.js data helpers
  const backgroundColor = [
    '#232D4F',
    '#2A3A64',
    '#314779',
    '#38538E',
    '#3F60A3',
    '#467CB8',
    '#4D89CD',
    '#5495E2',
    '#5BA2F7',
    '#62AFFF',
  ];

  const pieData = {
    labels: perType.map(d => d.label),
    datasets: [
      {
        data: perType.map(d => d.count),
        backgroundColor: backgroundColor,
      },
    ],
  };

  const barData = {
    labels: perYear.map(d => d.label),
    datasets: [
      {
        label: 'Normas',
        data: perYear.map(d => d.count),
        backgroundColor: backgroundColor,
      },
    ],
  };

  return (
    <section className='grid md:grid-cols-2 gap-6 mb-16'>
      <GraphCard title='Total Normas' value={overview?.total_normas ?? '…'} />
      <GraphCard
        title='Total Relaciones'
        value={overview?.total_relaciones ?? '…'}
      />
      <GraphCard title='Normas por Tipo' graph={<Pie data={pieData} />} />
      <GraphCard title='Normas por Año' graph={<Bar data={barData} />} />
    </section>
  );
}
