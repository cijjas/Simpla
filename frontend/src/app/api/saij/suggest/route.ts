import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const saijURL = `https://www.saij.gob.ar/suggest?${searchParams.toString()}`;

  const res = await fetch(saijURL, {
    headers: { 'x-requested-with': 'XMLHttpRequest' },
  });

  // --- decode Latin-1 properly ---
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder('latin1'); // <-- key fix here
  const text = decoder.decode(buffer);
  const json = JSON.parse(text);

  return NextResponse.json(json, { status: res.status });
}
