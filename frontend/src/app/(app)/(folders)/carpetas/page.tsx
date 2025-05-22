// app/(your-app-route)/page.tsx

import Component from '@/components/ui/comp-571'; // assuming it's a named export
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className='flex  w-full overflow-hidden'>
      {/* Static Left Sidebar with Card */}
      <div className='w-[300px] min-w-[240px] p-4 border-r border-border bg-background'>
        <Card className=' p-2'>
          <Component />
        </Card>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-y-auto p-6'>
        <h1 className='text-2xl font-semibold mb-4'>Proximamente</h1>
        {/* You can render dynamic content, cards, etc. here */}
        <p className='text-muted-foreground'>
          Esta sección todavía no está disponible. La idea es que puedas agrupar
          tus normas en carpetas para poder acceder a ellas más fácilmente. Por
          ejemplo, podés crear una carpeta para tus normas favoritas, otra para
          las que tenés que leer, o para las que tenés que compartir con tu
          equipo. ¡Pronto estará disponible!
        </p>
      </div>
    </div>
  );
}
