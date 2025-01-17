import React, { useState, useEffect } from 'react';
import './App.css'

function getFlagColor(value, minMaxLevels, sectionId) {
  if (!value || !minMaxLevels || !sectionId) return 'text-white';
  const section = minMaxLevels[sectionId];
  if (!section) return 'text-white';
  
  if (value > section.max) return 'text-red-400';
  if (value < section.min) return 'text-yellow-400';
  return 'text-green-400';
}

function getAverageValue(min, max) {
  if (min === null || max === null) return null;
  return Math.round((min + max) / 2);
}

function RiverSection({ section, minMaxLevels }) {
  const getSectionLimits = () => {
      if (!section || !section.id || !minMaxLevels) {
          console.log('Missing data:', { section, minMaxLevels });
          return { min: 'N/A', max: 'N/A' };
      }

      const sectionLimits = minMaxLevels[section.id] || {};
      return {
          min: sectionLimits.min || 'N/A',
          max: sectionLimits.max || 'N/A'
      };
  };

  const limits = getSectionLimits();

  if (!section) {
      return <div className="text-white">No section data available</div>;
  }

  return (
      <div className="bg-gray-800 shadow-2xl rounded-xl p-6 w-full mb-6 fade-in">
          <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-100 mb-2">{section.title}</h1>
              <div className="flex justify-center gap-4 text-sm">
                  <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-800 mr-2"></div>
                      <span className="text-gray-300">Histórico</span>
                  </div>
                  <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
                      <span className="text-gray-300">Pronosticado</span>
                  </div>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                  <div className="flex items-center">
                      <span className="text-gray-300">⚠️: Nivel medio, cuidado</span>
                      <span className="text-gray-300">‼️: Nivel Alto, peligro</span>
                  </div>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                  <div className="text-gray-300">
                      Límites establecidos - Promedio: {Math.round((limits.min + limits.max) / 2) || 'N/A'}
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4">
              {section.levels.map((level, index) => (
                  <div 
                      key={index} 
                      className="flex flex-col items-center space-y-2 day-indicator"
                  >
                      <div className={`w-24 h-24 rounded-xl ${level.type === 'dispensed' ? 'bg-indigo-800' : 'bg-indigo-600'} 
                          flex flex-col items-center justify-center p-2
                          transition-all duration-300`}
                      >
                          <span className="text-white font-bold text-base">
                              {new Date(level.date).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <span className={`text-lg ${getFlagColor(
                              level.type === 'dispensed' ? 
                                  level.dispensed : 
                                  getAverageValue(level.min, level.max), 
                              minMaxLevels, 
                              section.id
                          )}`}>
                              ⚠️‼️
                          </span>
                          {level.type === 'dispensed' ? (
                              <span className="text-white font-bold mt-1">{level.dispensed}</span>
                          ) : (
                              <div className="text-center mt-1">
                                  <div className="text-white text-sm">
                                      {getAverageValue(level.min, level.max)}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}

function App() {
  const [data, setData] = React.useState(null);
  const [minMaxLevels, setMinMaxLevels] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
      Promise.all([
          fetch('https://danitinez.github.io/aic-caudales/latest.json').then(r => r.json()),
          fetch('https://danitinez.github.io/aic-caudales/min_max_levels.json').then(r => r.json())
      ]).then(([latestData, minMaxData]) => {
          console.log('Fetched data:', { latestData, minMaxData });
          setData(latestData);
          setMinMaxLevels(minMaxData);
      }).catch(err => {
          console.error('Error fetching data:', err);
          setError(err.message);
      });
  }, []);

  if (error) return <div className="text-white">Error: {error}</div>;
  if (!data || !minMaxLevels) return <div className="text-white">Loading...</div>;

  const filteredSection = data.sections.find(section => section.order === 3);
  if (!filteredSection) return <div className="text-white">Sección no encontrada</div>;

  return (
      <div className="max-w-7xl mx-auto">
          <RiverSection section={filteredSection} minMaxLevels={minMaxLevels} />
      </div>
  );
}

export default App
