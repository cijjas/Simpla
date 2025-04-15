'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import GraphCard from './GraphCard';
import 'chart.js/auto';

const Doughnut = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Doughnut),
  { ssr: false },
);
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  ssr: false,
});

export default function StatsSection() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [overview, setOverview] = useState<any>(null);
  const [perType, setPerType] = useState<any[]>([]);
  const [perYear, setPerYear] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [ov, pt, py] = await Promise.all([
        fetch(`${baseUrl}/api/stats/overview`).then(r => r.json()),
        fetch(`${baseUrl}/api/stats/normas-per-type`).then(r => r.json()),
        fetch(`${baseUrl}/api/stats/normas-per-year`).then(r => r.json()),
      ]);
      setOverview(ov);
      setPerType(pt);
      setPerYear(py);
    }
    fetchData();
  }, [baseUrl]);

  // Prepare chart‑js datasets
  const perTypeData = {
    labels: perType.map(d => d.label),
    datasets: [
      {
        data: perType.map(d => d.count),
      },
    ],
  };

  const perYearData = {
    labels: perYear.map(d => d.label),
    datasets: [
      {
        label: 'Normas por año',
        data: perYear.map(d => d.count),
      },
    ],
  };

  if (!overview) return null; // or a spinner

  return (
    <section className='grid md:grid-cols-2 gap-6 mb-16'>
      <GraphCard title='Total Normas' value={overview.total_normas} />
      <GraphCard title='Total Relaciones' value={overview.total_relaciones} />
      <GraphCard
        title='Normas por Tipo'
        graph={<Doughnut data={perTypeData} />}
      />
      <GraphCard title='Normas por Año' graph={<Bar data={perYearData} />} />
    </section>
  );
}
