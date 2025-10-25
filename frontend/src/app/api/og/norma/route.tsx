import { normasAPI } from '@/features/normas/api/normas-api';
import { NormaDetail } from '@/features/normas/api/normas-api';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    return new Response('Missing NEXT_PUBLIC_SITE_URL', { status: 500 });
  }

  // Load fonts and image from public folder over HTTP
  const [geistFontData, loraFontData, logoBuffer] = await Promise.all([
    fetch(`${baseUrl}/fonts/Geist-Regular.ttf`).then(res => res.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Lora-Bold.ttf`).then(res => res.arrayBuffer()),
    fetch(`${baseUrl}/images/estampa.png`).then(res => res.arrayBuffer()),
  ]);

  const logoBase64 = `data:image/png;base64,${Buffer.from(logoBuffer).toString(
    'base64',
  )}`;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response('Missing ID', { status: 400 });

  const norma: NormaDetail = await normasAPI.getNorma(id);
  if (!norma) return new Response('Norma no encontrada', { status: 404 });

  const numero = norma.referencia?.numero ?? '';
  const anio = norma.sancion
    ? new Date(norma.sancion).getFullYear()
    : '';
  const title = `${norma.tipo_norma ?? 'Norma'} ${numero}/${anio}`;
  const normaTitle =
    norma.titulo_sumario ?? norma.titulo_resumido ?? '';
  const fechaPublicacion = norma.publicacion
    ? new Date(norma.publicacion).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const boletin =
    norma.nro_boletin && norma.pag_boletin
      ? `B.O.R.A ${norma.nro_boletin} • pág ${norma.pag_boletin}`
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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

        <p
          style={{
            fontFamily: 'Geist',
            fontSize: 36,
            marginTop: 24,
            color: '#555',
          }}
        >
          {normaTitle}
        </p>

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
        { name: 'Geist', data: geistFontData },
        { name: 'Lora', data: loraFontData },
      ],
    },
  );
}
