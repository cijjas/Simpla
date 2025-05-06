import { ImageResponse } from 'next/og';
import { getNormaDetalleResumen } from '@/lib/infoleg/api';
import type { Norma } from '@/lib/infoleg/types';

export const runtime = 'edge';
export const revalidate = 60 * 60 * 24 * 7;

// Load fonts from /public
const geistFont = fetch(
  new URL('../../../../../public/fonts/Geist-Regular.ttf', import.meta.url),
).then(res => res.arrayBuffer());

const loraFont = fetch(
  new URL('../../../../../public/fonts/Lora-Bold.ttf', import.meta.url),
).then(res => res.arrayBuffer());

// Load PNG logo
const logoBuffer = await fetch(
  new URL('../../../../../public/images/estampa.png', import.meta.url),
).then(res => res.arrayBuffer());

const logoBase64 = `data:image/png;base64,${Buffer.from(logoBuffer).toString(
  'base64',
)}`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response('Missing ID', { status: 400 });

  const norma: Norma = await getNormaDetalleResumen(id);
  if (!norma) return new Response('Norma no encontrada', { status: 404 });

  const numero = norma.idNormas?.[0]?.numero ?? '';
  const anio = norma.publicacion
    ? new Date(norma.publicacion).getFullYear()
    : '';
  const title = `${norma.tipoNorma ?? 'Norma'} ${numero}/${anio}`;
  const dependencia = norma.idNormas?.[0]?.dependencia ?? '';
  const fechaPublicacion = norma.publicacion
    ? new Date(norma.publicacion).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const boletin =
    norma.nroBoletin && norma.pagBoletin
      ? `B.O.R.A ${norma.nroBoletin} • pág ${norma.pagBoletin}`
      : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: '#fefefb',
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Ghosted logo */}
        <img
          src={logoBase64}
          alt='Logo'
          style={{
            position: 'absolute',
            right: 100,
            top: '65%',
            transform: 'translateY(-50%)',
            width: 450,
            opacity: 0.03,
          }}
        />

        {/* Title */}
        <h1
          style={{
            fontFamily: 'Lora',
            fontSize: 64,
            color: '#1e2749',
            margin: 0,
          }}
        >
          {title}
        </h1>

        {/* Dependencia */}
        <p
          style={{
            fontFamily: 'Geist',
            fontSize: 36,
            marginTop: 24,
            color: '#555',
          }}
        >
          {dependencia}
        </p>

        {/* Footer Info */}
        <div
          style={{
            marginTop: 'auto',
            fontSize: 28,
            color: '#777',
            fontFamily: 'Geist',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {fechaPublicacion && <span>Publicado el {fechaPublicacion}</span>}
          {boletin && <span>{boletin}</span>}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Geist', data: await geistFont },
        { name: 'Lora', data: await loraFont },
      ],
    },
  );
}
