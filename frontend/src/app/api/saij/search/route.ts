import { NextRequest, NextResponse } from 'next/server';
import { saijSearch } from '@/features/saij/utils/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = await saijSearch(searchParams);
  return NextResponse.json(data);
}
