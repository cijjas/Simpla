import { InferenceClient } from '@huggingface/inference';

const hf = new InferenceClient(process.env.HF_API_KEY!);

export async function embed(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'intfloat/multilingual-e5-large',
    inputs: `query: ${text}`,
  });

  // Defensive check
  if (!Array.isArray(result)) {
    console.error('❌ Unexpected response from HF API:', result);
    throw new Error('HF Inference API did not return an array.');
  }

  const vec: number[] = Array.isArray(result[0])
    ? (result[0] as number[])
    : (result as number[]);

  if (!vec || vec.length !== 1024) {
    throw new Error(
      `❌ Invalid embedding dimension: got ${vec?.length}, expected 1024`,
    );
  }

  return vec;
}
