// components/dashboard/StatsSection.tsx
import GraphCard from './GraphCard';

export default function StatsSection() {
  return (
    <section className='grid md:grid-cols-2 gap-6 mb-16'>
      <GraphCard src='/graph-line.svg' alt='Line graph' />
      <GraphCard src='/pie-chart.svg' alt='Pie chart' />
    </section>
  );
}
