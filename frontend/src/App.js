import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar datos iniciales
    const fetchCiclos = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/ciclos');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setCiclos(data.ciclos || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCiclos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCiclos();
  }, []);

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Análisis Normativo</h1>
        <p>Herramienta para detectar loops y agujeros legales</p>
      </header>
      <main>
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
