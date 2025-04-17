import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // forward every query param to SAIJ
  const saijURL = `https://www.saij.gob.ar/busqueda?${searchParams.toString()}`;

  const res = await fetch(saijURL, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
