import { NextResponse } from 'next/server';
import { ragAnswer } from '@/lib/rag/rag';
import { z } from 'zod';

const Body = z.object({
  question: z.string().min(1),
  provinces: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const { question, provinces } = Body.parse(await req.json());
    const answer = await ragAnswer(question, provinces);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
