'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DashboardPage() {
  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Dashboard</h1>
        <Button>Nuevo reporte</Button>
      </div>

      {/* Overview Cards */}
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>1,248</p>
            <p className='text-sm text-muted-foreground'>+12% este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>$9,730</p>
            <p className='text-sm text-muted-foreground'>+8.5% este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>231</p>
            <p className='text-sm text-muted-foreground'>-5% este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>3.4%</p>
            <p className='text-sm text-muted-foreground'>+0.2% este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Table */}
      <Tabs defaultValue='recent'>
        <TabsList>
          <TabsTrigger value='recent'>Recientes</TabsTrigger>
          <TabsTrigger value='pendientes'>Pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value='recent'>
          <Card>
            <CardHeader>
              <CardTitle>Últimos registros</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>#{1000 + i}</TableCell>
                      <TableCell>Cliente {i + 1}</TableCell>
                      <TableCell>Aprobado</TableCell>
                      <TableCell className='text-right'>
                        $ {(i + 1) * 120}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='pendientes'>
          <Card>
            <CardHeader>
              <CardTitle>Tareas pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='text-muted-foreground'>
                  ✓ Validar usuarios nuevos
                </li>
                <li className='text-muted-foreground'>
                  ✓ Revisar métricas semanales
                </li>
                <li className='text-muted-foreground'>
                  ✓ Subir informe mensual
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
