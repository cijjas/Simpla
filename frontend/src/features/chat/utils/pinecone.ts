import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export const index = pinecone.index(
  process.env.PINECONE_INDEX_NAME!,
  process.env.PINECONE_HOST, // host is optional but keeps latency low
);
