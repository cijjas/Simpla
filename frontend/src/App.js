import React, { useState, useEffect } from 'react';
import './App.css';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

function App() {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoData, setTipoData] = useState(null);
  const [anioData, setAnioData] = useState(null);
  const [relTipoData, setRelTipoData] = useState(null);
  const [topModData, setTopModData] = useState(null);
  const [modsAnioData, setModsAnioData] = useState(null);

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // 1. ciclos
        const ciclosRes = await fetch(`${API_BASE}/api/ciclos`);
        if (!ciclosRes.ok) throw new Error(`ciclos ${ciclosRes.status}`);
        const ciclosJson = await ciclosRes.json();
        setCiclos(ciclosJson.ciclos || []);

        // 2. tipo counts
        const tipoRes = await fetch(`${API_BASE}/api/stats/tipo_counts`);
        const tipoJson = await tipoRes.json();
        setTipoData(tipoJson);

        // 3. normas por anio
        const anioRes = await fetch(`${API_BASE}/api/stats/normas_por_anio`);
        setAnioData(await anioRes.json());

        // 4. relaciones por tipo
        const relRes = await fetch(`${API_BASE}/api/stats/relaciones_por_tipo`);
        setRelTipoData(await relRes.json());

        // 5. top modificadoras
        const topRes = await fetch(`${API_BASE}/api/stats/top_modificadoras`);
        setTopModData(await topRes.json());

        // 6. modificaciones por anio
        const modsAnioRes = await fetch(
          `${API_BASE}/api/stats/modificaciones_por_anio`,
        );
        setModsAnioData(await modsAnioRes.json());

        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Análisis Normativo</h1>
        <p>Herramienta para detectar loops y agujeros legales</p>
      </header>
      <main>
        <section>
          <h2>Distribución por Tipo de Norma</h2>
          {tipoData && (
            <Pie
              data={{
                labels: tipoData.labels,
                datasets: [{ data: tipoData.values }],
              }}
            />
          )}
        </section>

        <section>
          <h2>Normas sancionadas por Año</h2>
          {anioData && (
            <Bar
              data={{
                labels: anioData.labels,
                datasets: [{ label: 'Normas', data: anioData.values }],
              }}
            />
          )}
        </section>

        <section>
          <h2>Relaciones por Tipo</h2>
          {relTipoData && (
            <Bar
              data={{
                labels: relTipoData.labels,
                datasets: [{ label: 'Relaciones', data: relTipoData.values }],
              }}
            />
          )}
        </section>

        <section>
          <h2>Top 10 Normas que más Modifican</h2>
          {topModData && (
            <Bar
              data={{
                labels: topModData.labels,
                datasets: [
                  {
                    label: 'Modificaciones realizadas',
                    data: topModData.values,
                  },
                ],
              }}
            />
          )}
        </section>

        <section>
          <h2>Modificaciones por Año</h2>
          {modsAnioData && (
            <Line
              data={{
                labels: modsAnioData.labels,
                datasets: [
                  {
                    label: 'Modificaciones',
                    data: modsAnioData.values,
                    fill: false,
                  },
                ],
              }}
            />
          )}
        </section>

        <section>
          <h2>Ciclos Normativos Detectados</h2>
          {loading ? (
            <p>Cargando datos...</p>
          ) : error ? (
            <p className='error'>Error: {error}</p>
          ) : ciclos.length === 0 ? (
            <p>No se encontraron ciclos normativos.</p>
          ) : (
            <ul className='ciclos-list'>
              {ciclos.map((ciclo, index) => (
                <li key={index} className='ciclo-item'>
                  <strong>Ciclo {index + 1}:</strong>
                  <p>Inicio: {ciclo.inicio}</p>
                  <p>Fin: {ciclo.fin}</p>
                  <p>Ruta: {ciclo.ciclo?.join(' → ')}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
