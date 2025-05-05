'use client';
import { Card } from '@/components/ui/card';
import { JSX } from 'react';

export function GraphCard({
  title,
  subtitle,
  value,
  graph,
}: {
  title: string;
  subtitle?: string;
  value?: string | number;
  graph?: JSX.Element;
}) {
  return (
    <Card className='p-6 shadow-sm hover:shadow-md transition-shadow'>
      <h3 className='text-base font-semibold text-center'>{title}</h3>
      {subtitle && (
        <p className='text-xs text-slate-500 text-center mb-2'>{subtitle}</p>
      )}
      <div className='min-h-40 flex flex-col items-center justify-center gap-2'>
        {value !== undefined && (
          <p className='text-2xl font-bold text-navy-900'>{value}</p>
        )}
        {graph}
      </div>
    </Card>
  );
}
