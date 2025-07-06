import React, { Component } from 'react';
import Gauge from './Gauge';


class RiverSection extends Component {
  getFlagColor(value, minMaxLevels, sectionId) {
    if (!value || !minMaxLevels || !sectionId) return 'text-white';
    const section = minMaxLevels[sectionId];
    if (!section) return 'text-white';

    if (value > section.max) return 'text-red-400';
    if (value < section.min) return 'text-yellow-400';
    return 'text-green-400';
  }

  getAverageValue(min, max) {
    if (min === null || max === null) return null;
    return Math.round((min + max) / 2);
  }

  getValueToDisplay(level) {
    if (level.type === 'dispensed') return level.dispensed;
    return this.getAverageValue(level.min, level.max);
  }

  getSectionLimits() {
    console.log('Props:', this.props);
    const sectionLimits = this.props.minMaxLevels || {min: 0, max: 0};
    return sectionLimits;
  }

  isToday(dateStr) {
    const today = new Date();
    const cardDate = new Date(dateStr);
    
    return today.getFullYear() === cardDate.getFullYear() &&
           today.getMonth() === cardDate.getMonth() &&
           today.getDate() === cardDate.getDate();
  }

  render() {
    const { section, minMaxLevels } = this.props;
    const limits = this.getSectionLimits();
    const average = this.getAverageValue(limits.min, limits.max);


    console.log('MinMaxLevels:', minMaxLevels);
    console.log('Limits:', limits);
    console.log('Average:', average);

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
            <div className="text-gray-300">
              Límites establecidos - Min: {limits.min}  Max: {limits.max}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-4">
          {section.levels.map((level, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center space-y-2 day-indicator"
            >
              {this.isToday(level.date) && (
                <span className="text-white text-xs font-bold bg-indigo-700 px-2 py-0.5 rounded-t-md -mb-1">
                  HOY
                </span>
              )}
              <div className={`w-24 h-24 rounded-xl 
                ${level.type === 'dispensed' ? 'bg-gray-700' : 'bg-indigo-600'}
                ${this.isToday(level.date) ? 'border-2 border-yellow-400' : ''}
                flex flex-col items-center justify-center p-2
                transition-all duration-300`}
              >
                <span className={`text-white font-bold text-base
                  ${this.isToday(level.date) ? 'underline decoration-1 underline-offset-4' : ''}`}
                >
                  {new Date(level.date).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
                </span>
                
                <Gauge min={limits.min} max={limits.max} value={this.getValueToDisplay(level)} />

                {level.type === 'dispensed' ? (
                  <span className="text-gray-300 font-bold mt-1">{level.dispensed}</span>
                ) : (
                  <div className="text-center mt-1">
                    <div className="text-white text-sm">
                      {this.getValueToDisplay(level)}
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
}

export default RiverSection;