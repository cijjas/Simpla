import { NormaDetalladaDto } from '@/features/infoleg/utils/dto';
import { NextRequest, NextResponse } from 'next/server';

const upstreamBase = process.env.INFOLEG_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const query = req.nextUrl.searchParams;
  const resumen = query.get('resumen') === 'true';

  // ✅ Corrected Infoleg upstream URL using query param
  const upstreamUrl = `${upstreamBase}/api/v2.0/nacionales/normativos?id=${id}${
    resumen ? '&resumen=true' : ''
  }`;

  const upstreamRes = await fetch(upstreamUrl, { cache: 'no-store' });

  if (!upstreamRes.ok) {
    const err = await upstreamRes.json().catch(() => ({
      error: 'Respuesta no válida del servidor Infoleg',
    }));
    return NextResponse.json(err, { status: upstreamRes.status });
  }

  const dto: NormaDetalladaDto = await upstreamRes.json();

  /** ✅ Rewrites %%server_name%% to your own proxy route */
  const rewrite = (html?: string | null) =>
    html?.replace(/%%server_name%%/g, '/api/infoleg/recurso');

  dto.textoNorma = rewrite(dto.textoNorma);
  dto.textoNormaAct = rewrite(dto.textoNormaAct);

  return NextResponse.json(dto);
}
