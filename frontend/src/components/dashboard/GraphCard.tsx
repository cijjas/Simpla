'use client';
import { Card } from '@/components/ui/card';
import { JSX } from 'react';

export default function GraphCard({
  title,
  value,
  graph,
}: {
  title: string;
  value?: string | number;
  graph?: JSX.Element;
}) {
  return (
    <Card className='p-6'>
      <div className='h-40 flex flex-col items-center justify-center'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        {value !== undefined && <p className='text-xl'>{value}</p>}
        {graph}
      </div>
    </Card>
  );
}
