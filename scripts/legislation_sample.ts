import axios from 'axios';
import { Pool } from 'pg';
import 'dotenv/config';
import https from 'https';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const INFOLEG_BASE_URL =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0';
const LEGISLACIONES_URL = `${INFOLEG_BASE_URL}/nacionales/normativos/legislaciones`;
const NORMATIVOS_URL = `${INFOLEG_BASE_URL}/nacionales/normativos`;

const createTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS normas (
        id SERIAL PRIMARY KEY, 
        infoleg_id INT UNIQUE NOT NULL,
        jurisdiccion VARCHAR(255),
        clase_norma VARCHAR(255),
        tipo_norma VARCHAR(255),
        sancion DATE,
        id_normas JSONB,
        publicacion DATE,
        titulo_sumario TEXT,
        titulo_resumido TEXT,
        observaciones TEXT,
        nro_boletin VARCHAR(255),
        pag_boletin VARCHAR(255),
        texto_resumido TEXT,
        texto_norma TEXT,
        texto_norma_actualizado TEXT,
        estado VARCHAR(255),
        lista_normas_que_complementa JSONB,
        lista_normas_que_la_complementan JSONB
      );
    `);

    console.log('Table "normas" is ready.');
  } finally {
    client.release();
  }
};

const insertNorma = async (norma: any) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO normas (
        infoleg_id, jurisdiccion, clase_norma, tipo_norma, sancion, id_normas,
        publicacion, titulo_sumario, titulo_resumido, observaciones, nro_boletin,
        pag_boletin, texto_resumido, texto_norma, estado,
        lista_normas_que_complementa, lista_normas_que_la_complementan, texto_norma_actualizado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) ON CONFLICT (infoleg_id) DO NOTHING;
    `;
    const values = [
      norma.id,
      norma.jurisdiccion,
      norma.claseNorma,
      norma.tipoNorma,
      norma.sancion || null,
      JSON.stringify(norma.idNormas),
      norma.publicacion || null,
      norma.tituloSumario,
      norma.tituloResumido,
      norma.observaciones,
      norma.nroBoletin,
      norma.pagBoletin,
      norma.textoResumido,
      norma.textoNorma,
      norma.estado,
      JSON.stringify(norma.listaNormasQueComplementa),
      JSON.stringify(norma.listaNormasQueLaComplementan),
      norma.textoNormaAct,
    ];
    await client.query(query, values);
    console.log(`📄 Upserted norma with infoleg_id: ${norma.id}`);
  } catch (error) {
    console.error(`Error inserting norma ${norma.id}:`, error);
  } finally {
    client.release();
  }
};

const fetchNormaDetails = async (id: number, agent: https.Agent, maxRetries: number = 5, baseDelay: number = 2000) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await axios.get(
        NORMATIVOS_URL,
        {
          params: { id },
          httpsAgent: agent,
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching details for norma ID ${id} (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries - 1) {
        console.error(`🚫 Failed to fetch norma ID ${id} after ${maxRetries} attempts. Skipping...`);
        return null;
      }
      
      const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      console.log(`⏳ Waiting ${delay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  return null;
};

const fetchLegislationIdsForYearSample = async (year: number, agent: https.Agent, sampleSize: number = 5): Promise<number[]> => {
  const limit = Math.min(sampleSize, 50); // Don't request more than 50 per page, but limit to sample size
  const offset = 1; // Only get the first page
  const ids: number[] = [];
  
  console.log(`📊 Fetching SAMPLE of ${sampleSize} IDs for year ${year}...`);
  
  const params = {
    sancion: year.toString(),
    limit: limit.toString(),
    offset: offset.toString()
  };
  
  try {
    const response = await axios.get(LEGISLACIONES_URL, {
      params,
      httpsAgent: agent,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 409) {
      console.log(`⚠️  Year ${year} returned 409. Skipping...`);
      return ids;
    }
    
    const data = response.data;
    const results = data.results || [];
    
    const totalCount = data.metadata?.resultset?.count || 0;
    if (totalCount === 0) {
      console.log(`⚠️  Year ${year} has no results. Skipping...`);
      return ids;
    }
    
    console.log(`  📈 Total available for ${year}: ${totalCount} laws`);
    
    if (!results || results.length === 0) {
      console.log(`  🛑 No results returned for year ${year}.`);
      return ids;
    }
    
    // Take only the first sampleSize items
    const sampleResults = results.slice(0, sampleSize);
    const pageIds = sampleResults.map((item: any) => item.id);
    ids.push(...pageIds);
    
    console.log(`  ✅ Sampled ${ids.length} laws from year ${year}`);
    
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Network error in year ${year}:`, error.message);
    } else {
      console.error(`❌ Error parsing JSON in year ${year}:`, error);
    }
  }
  
  return ids;
};

const main = async () => {
  console.log('🚀 Starting legislation sampling script...\n');
  
  await createTable();

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Configuration for sampling
  const sampleSize = 5; // Number of legislations to sample per year
  
  // You can modify these years for your sampling range
  const startYear = 2001;
  const endYear = 2025;
  
  console.log(`📋 Sampling ${sampleSize} legislations per year from ${startYear} to ${endYear}\n`);
  
  let totalSampled = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    console.log(`\n📅 Processing year ${year}...`);
    
    const ids = await fetchLegislationIdsForYearSample(year, agent, sampleSize);
    console.log(`  🔍 Found ${ids.length} IDs for sampling in ${year}`);
    
    if (ids.length === 0) {
      console.log(`  ⏭️  Skipping year ${year} - no data available`);
      continue;
    }
    
    let processedInYear = 0;
    for (const legId of ids) {
      const data = await fetchNormaDetails(legId, agent);
      if (data) {
        await insertNorma(data);
        processedInYear++;
        totalSampled++;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between details requests
    }
    
    console.log(`  ✅ Completed year ${year}: ${processedInYear}/${ids.length} legislations processed`);
  }

  console.log(`\n🎉 Sampling completed!`);
  console.log(`📊 Total legislations sampled: ${totalSampled}`);
  console.log(`📈 Years processed: ${startYear}-${endYear}`);
  console.log(`🔢 Average per year: ${(totalSampled / (endYear - startYear + 1)).toFixed(1)}`);
  
  await pool.end();
};

main().catch(err => {
  console.error('❌ Sampling script failed:', err);
  pool.end();
});
