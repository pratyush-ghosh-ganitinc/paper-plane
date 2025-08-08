import React from 'react';
import type { PlaneConfiguration } from '../game/PlaneDatabase';
import './PlaneSelector.css';

interface PlaneSelectorProps {
  planes: PlaneConfiguration[];
  selectedPlaneId: string;
  onPlaneSelect: (planeId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const PlaneSelector: React.FC<PlaneSelectorProps> = ({
  planes,
  selectedPlaneId,
  onPlaneSelect,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  const handlePlaneSelect = (planeId: string) => {
    onPlaneSelect(planeId);
    onClose();
  };

  return (
    <div className="plane-selector-overlay">
      <div className="plane-selector">
        <div className="plane-selector-header">
          <h2>Choose Your Paper Plane</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close selector"
          >
            ×
          </button>
        </div>
        
        <div className="planes-grid">
          {planes.map((plane) => (
            <div
              key={plane.id}
              className={`plane-card ${selectedPlaneId === plane.id ? 'selected' : ''} ${!plane.unlocked ? 'locked' : ''}`}
              onClick={() => plane.unlocked && handlePlaneSelect(plane.id)}
            >
              <div className="plane-preview">
                <div 
                  className="plane-color-preview"
                  style={{ backgroundColor: `#${plane.properties.color.toString(16).padStart(6, '0')}` }}
                />
                {!plane.unlocked && <div className="lock-overlay">🔒</div>}
              </div>
              
              <div className="plane-info">
                <h3 className="plane-name">{plane.name}</h3>
                <p className="plane-type">{plane.type.toUpperCase()}</p>
                <p className="plane-description">{plane.description}</p>
                
                <div className="plane-stats">
                  <div className="stat">
                    <span className="stat-label">Speed:</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill speed"
                        style={{ width: `${(plane.properties.maxSpeed / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="stat">
                    <span className="stat-label">Agility:</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill agility"
                        style={{ width: `${(plane.properties.turnRate / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="stat">
                    <span className="stat-label">Size:</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill size"
                        style={{ width: `${(plane.properties.scale / 1.5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {plane.unlocked ? (
                  <button 
                    className={`select-button ${selectedPlaneId === plane.id ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaneSelect(plane.id);
                    }}
                  >
                    {selectedPlaneId === plane.id ? 'Selected' : 'Select'}
                  </button>
                ) : (
                  <div className="unlock-requirement">
                    <span>🔒 Unlock by achieving high scores!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="selector-footer">
          <p>Tip: Different planes have unique flight characteristics!</p>
        </div>
      </div>
    </div>
  );
};
