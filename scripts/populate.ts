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

const fetchNormaDetails = async (id: number, agent: https.Agent) => {
  try {
    const response = await axios.get(
      `${INFOLEG_BASE_URL}/nacionales/normativos`,
      {
        params: { id },
        httpsAgent: agent,
      },
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for norma ID ${id}:`, error);
    return null;
  }
};

const fetchNormasByDate = async (date: string, agent: https.Agent) => {
  try {
    console.log(`Fetching normas for date: ${date}...`);
    const response = await axios.get(
      `${INFOLEG_BASE_URL}/nacionales/normativos/publicaciones/${date}`,
      { httpsAgent: agent },
    );

    const { results } = response.data;
    if (!results || results.length === 0) {
      console.log(`No results for ${date}`);
      return;
    }

    for (const normaSummary of results) {
      const normaDetails = await fetchNormaDetails(normaSummary.id, agent);
      if (normaDetails) {
        await insertNorma(normaDetails);
      }
      // Wait 500ms to avoid saturating the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    // It's common to get 404s for dates with no publications, so we'll log it differently.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`No publications found for date: ${date}`);
    } else {
      console.error(`Error fetching data for date ${date}:`, error);
    }
    // Wait a bit before continuing to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const main = async () => {
  await createTable();

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  let currentDate = new Date('1854-01-01');
  const endDate = new Date(); // Today

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    await fetchNormasByDate(dateString, agent);
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  console.log('Finished fetching all data.');
  await pool.end();
};

main().catch(err => {
  console.error('Script failed:', err);
  pool.end();
});
