import { embed } from './embedding';
import { index } from './pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const K = Number(process.env.K_RETRIEVE ?? 5);

// 🧠 Prompt template: Gemini will see this exactly
const PROMPT_TEMPLATE = `
Eres un/a **abogado/a constitucionalista argentino/a**.  
Tu tarea es **contestar en UNA sola frase** y **exclusivamente** con la
información que aparece dentro de las etiquetas <context></context>.

Reglas de oro (cúmplelas al pie de la letra):

1. Si la respuesta está en el contexto, da la solución **exactamente** como
   figura allí, sin agregar ni quitar nada relevante.
2. Al final de la frase, escribe entre paréntesis el/los número(s) de
   artículo(s) que sustenten la respuesta -por ejemplo: **(art. 14)**.
   - Si el fragmento de contexto trae algo como “Artículo 14 bis”, ponlo igual: **(art. 14bis)**.
3. Si la información **no** aparece en el contexto, contesta **exactamente**:
   > No tengo información sobre esto.
4. No inventes datos, no cites fuentes externas, no expliques tu razonamiento.
5. Responde en español neutro y evita tecnicismos innecesarios.
6. Si no sabes la respuesta, responde 'no tengo información sobre esto'.
7
<context>
{context}
</context>

Pregunta: {question}
Respuesta:
`.trim();

export async function retrieve(
  query: string,
  provinces: string[],
): Promise<string[]> {
  const vector = await embed(`query: ${query}`);
  const filter =
    provinces.length > 0 ? { province: { $in: provinces } } : undefined;

  const res = await index.query({
    vector,
    topK: K,
    includeMetadata: true,
    filter,
  });

  const texts =
    res.matches?.map(m => m.metadata?.text as string).filter(Boolean) ?? [];

  console.log(`🔍 Retrieved ${texts.length} context chunks for: "${query}"`);
  return texts;
}

export async function ragAnswer(
  question: string,
  provinces: string[],
): Promise<string> {
  const contextChunks = await retrieve(question, provinces);
  const context = contextChunks.join('\n\n');

  const prompt = PROMPT_TEMPLATE.replace('{question}', question.trim()).replace(
    '{context}',
    context || 'No hay información contextual disponible.',
  );

  const result = await chatModel.generateContent(prompt);
  const text = result.response.text().trim();

  console.log(`🤖 Gemini response: ${text}`);
  return text;
}
