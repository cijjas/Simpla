// components/dashboard/GraphCard.tsx
import Image from 'next/image';
import { Card } from '@/components/ui/card';

export default function GraphCard({ src, alt }: { src: string; alt: string }) {
  return (
    <Card className='p-6'>
      <div className='h-40 flex items-center justify-center'>
        <Image
          src={src}
          alt={alt}
          width={300}
          height={150}
          className='object-contain'
        />
      </div>
    </Card>
  );
}
