import { NextRequest, NextResponse } from 'next/server';
import { saijSuggest } from '@/features/saij/utils/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = await saijSuggest(searchParams);
  return NextResponse.json(data);
}
