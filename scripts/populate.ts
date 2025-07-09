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
    // id: ID autoincremental de la norma
    // infoleg_id: ID de la norma en Infoleg (único)
    // jurisdiccion: 'Nacional', 'Provincial', 'Municipal'
    // clase_norma : 'DNU'
    // tipo_norma: 'Ley', 'Decreto', etc.
    // sancion: Fecha de sanción de la norma YYYY-MM-DD
    // id_normas: Lista de IDs de normas relacionadas (JSONB)
    // publicacion: Fecha de publicación en el Boletín Oficial YYYY-MM-DD
    // titulo_sumario: Título categorico de la norma
    // titulo_resumido: Título completo de la norma
    // observaciones: Observaciones adicionales
    // nro_boletin: Número del Boletín Oficial donde se publicó
    // pag_boletin: Página del Boletín Oficial donde se publicó
    // texto_resumido: Texto resumido de la norma
    // texto_norma: Texto completo de la norma
    // texto_norma_actualizado: Texto actualizado de la norma
    // estado: Estado de la norma (vigente, derogada, etc.)
    // lista_normas_que_complementa: Lista de normas que complementa (JSONB)
    // lista_normas_que_la_complementan: Lista de normas que complementan a
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
    console.log(`Upserted norma with infoleg_id: ${norma.id}`);
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

const fetchLegislationIdsForYear = async (year: number, agent: https.Agent): Promise<number[]> => {
  const limit = 50;
  let offset = 1;
  const ids: number[] = [];
  let totalPages = 0;
  let totalCount = 0;
  
  console.log(`Fetching IDs for year ${year}...`);
  
  while (true) {
    const params = {
      sancion: year.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    };
    
    // Add retry logic for page fetching
    let pageSuccess = false;
    let pageAttempts = 0;
    const maxPageRetries = 3;
    
    while (!pageSuccess && pageAttempts < maxPageRetries) {
      try {
        pageAttempts++;
        console.log(`  📄 Fetching page ${offset}${pageAttempts > 1 ? ` (attempt ${pageAttempts}/${maxPageRetries})` : ''}...`);
        
        const response = await axios.get(LEGISLACIONES_URL, {
          params,
          httpsAgent: agent,
          headers: {
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });
        
        if (response.status === 409) {
          console.log(`⚠️  Year ${year} returned 409. Skipping...`);
          return ids;
        }
        
        const data = response.data;
        const results = data.results || [];
        
        if (offset === 1) {
          totalCount = data.metadata?.resultset?.count || 0;
          if (totalCount === 0) {
            console.log(`⚠️  Year ${year} has no results. Skipping...`);
            return ids;
          }
          totalPages = Math.ceil(totalCount / limit);
          console.log(`  📊 Total: ${totalCount} laws, ${totalPages} pages.`);
        }
        
        if (!results || results.length === 0) {
          console.log(`  🛑 Empty page at offset ${offset}. Finishing year...`);
          pageSuccess = true;
          break;
        }
        
        const pageIds = results.map((item: any) => item.id);
        ids.push(...pageIds);
        
        console.log(`  ✅ Page ${offset}/${totalPages} OK. Total accumulated: ${ids.length}/${totalCount}`);
        pageSuccess = true;
        
        if (offset >= totalPages) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between pages
        
      } catch (error: any) {
        console.error(`❌ Error fetching page ${offset} for year ${year} (attempt ${pageAttempts}/${maxPageRetries}):`, error.message);
        
        if (pageAttempts < maxPageRetries) {
          const retryDelay = 1000 * Math.pow(2, pageAttempts - 1); // Exponential backoff: 1s, 2s, 4s
          console.log(`⏳ Retrying page ${offset} in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(`🚫 Failed to fetch page ${offset} for year ${year} after ${maxPageRetries} attempts. Aborting year.`);
          return ids; // Return what we have so far, but don't continue
        }
      }
    }
    
    if (!pageSuccess) {
      console.error(`💥 Could not fetch page ${offset} for year ${year}. Stopping pagination for this year.`);
      break;
    }
    
    if (offset >= totalPages) {
      break;
    }
    
    offset += 1;
  }
  
  // Validation: Check if we got all expected results
  if (totalCount > 0 && ids.length < totalCount) {
    console.warn(`⚠️  WARNING: Expected ${totalCount} laws for year ${year}, but only collected ${ids.length} IDs. Some pages may have failed.`);
  } else if (totalCount > 0) {
    console.log(`✅ Successfully collected all ${ids.length} laws for year ${year}`);
  }
  
  return ids;
};

const main = async () => {
  await createTable();

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const currentYear = new Date().getFullYear();
  
  // For testing, let's start with a smaller range - you can modify this
  // From 1940 to 1945 (like in your Python script) for testing
  // Change to: for (let year = 1854; year <= currentYear; year++) for full range
  for (let year = 1940; year <= 1945; year++) {
    const ids = await fetchLegislationIdsForYear(year, agent);
    console.log(`Total found for ${year}: ${ids.length}`);
    
    for (const legId of ids) {
      const data = await fetchNormaDetails(legId, agent);
      if (data) {
        await insertNorma(data);
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // 200ms delay between details requests
    }
  }

  console.log('Finished fetching all data.');
  await pool.end();
};

main().catch(err => {
  console.error('Script failed:', err);
  pool.end();
});
