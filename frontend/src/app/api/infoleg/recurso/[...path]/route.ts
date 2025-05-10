import { NextRequest, NextResponse } from 'next/server';

const upstreamBase = process.env.INFOLEG_BASE_URL!;

/**
 * Streams any resource from Infoleg through
 *   /api/infoleg/recurso/<whatever>
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  const upstreamUrl = `${upstreamBase}/${path.join('/')}${req.nextUrl.search}`;

  const upstreamRes = await fetch(upstreamUrl, {
    // forward cookies / auth if needed
    headers: { Accept: '*/*' },
    cache: 'no-store',
  });

  /** If Infoleg sends the “HTML in JSON” wrapper */
  if (
    upstreamRes.ok &&
    upstreamRes.headers.get('content-type')?.startsWith('application/json')
  ) {
    const json = (await upstreamRes.json()) as {
      'content-type': string;
      data: string;
    };

    if (json['content-type'] === 'text/html') {
      const html = json.data.replace(
        /%%server_name%%/g,
        '/api/infoleg/recurso',
      );
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf‑8' },
      });
    }
  }

  /** Stream all other types (jpg, pdf, …) 1‑to‑1 */
  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: upstreamRes.headers,
  });
}
