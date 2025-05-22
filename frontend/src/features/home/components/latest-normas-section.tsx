'use client';

import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NormaCard from '@/features/infoleg/busqueda/norma-card';
import { NormaItem } from '@/features/infoleg/utils/types';
import { getUltimasNNormas } from '@/features/infoleg/utils/api';
import { useEffect, useState } from 'react';

export function LatestNormasSection() {
  const [normas, setNormas] = useState<NormaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNormas() {
      try {
        const data = await getUltimasNNormas(6);
        setNormas(data);
      } catch (error) {
        console.error('Error fetching normas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNormas();
  }, []);

  return (
    <section className='py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-12'>
          <h2 className='text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-200 mb-4 sm:mb-0'>
            <Clock className='inline-block mr-3 h-7 w-7 text-primary' />
            Últimas Normas Publicadas
          </h2>
          <Button
            variant='link'
            asChild
            className='text-primary hover:text-primary/80'
          >
            <Link href='/busqueda' className='flex items-center'>
              Ver todas
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className='h-32 animate-pulse bg-slate-100 dark:bg-slate-800'
              />
            ))}
          </div>
        ) : normas.length > 0 ? (
          <div className='grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {normas.map(norma => (
              <NormaCard key={norma.id} norma={norma} />
            ))}
          </div>
        ) : (
          <Card className='border-slate-200 dark:border-slate-700'>
            <CardContent className='py-12 text-center'>
              <p className='text-muted-foreground'>
                No hay normas recientes disponibles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
