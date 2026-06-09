import React, { useState, useEffect } from 'react';
import './App.css';
import RiverSection from './components/RiverSection';

function App() {
  const [data, setData] = useState(null);
  const [minMaxLevels, setMinMaxLevels] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('latest.json').then(r => r.json()),
      fetch('min_max_levels.json').then(r => r.json())
    ]).then(([latestData, minMaxData]) => {
      setData(latestData);
      setMinMaxLevels(minMaxData);
    }).catch(err => setError(err.message));
  }, []);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-400 text-sm">
      Error cargando datos: {error}
    </div>
  );
  if (!data || !minMaxLevels) return (
    <div className="min-h-screen flex items-center justify-center gap-3 text-slate-400 text-sm">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Cargando datos...
    </div>
  );

  const orderedSections = [...data.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-3xl">🌊</span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Caudales AIC</h1>
          </div>
          <p className="text-slate-400 text-sm mb-1">
            Caudales programados · Provincia del Neuquén
          </p>
          <p className="text-slate-500 text-xs">
            Valores en m³/s · Última actualización:{' '}
            {new Date(data.last_update + 'T00:00:00').toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {orderedSections.map((section, i) => (
          <RiverSection key={i} section={section} minMaxLevels={minMaxLevels[section.id]} />
        ))}

        <footer className="text-center text-slate-700 text-xs mt-10">
          Fuente:{' '}
          <a
            href="http://www.aic.gov.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors underline"
          >
            AIC – Autoridad Interjurisdiccional de las Cuencas
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
