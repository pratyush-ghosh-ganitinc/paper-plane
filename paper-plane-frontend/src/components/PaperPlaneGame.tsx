import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameConfig } from '../game/GameEngine';
import { PaperPlaneDatabase } from '../game/PlaneDatabase';
import { PlaneSelector } from './PlaneSelector';
import './PaperPlaneGame.css';

interface PaperPlaneGameProps {
  onGameStart?: () => void;
  onGameStop?: () => void;
}

export const PaperPlaneGame: React.FC<PaperPlaneGameProps> = ({ 
  onGameStart, 
  onGameStop 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const planeDatabase = useRef(new PaperPlaneDatabase());
  
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [showPlaneSelector, setShowPlaneSelector] = useState(false);
  const [selectedPlaneId, setSelectedPlaneId] = useState('basic-white');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    planeSpeed: 0.05,
    sensitivity: 0.002,
    fieldOfView: 75,
    renderDistance: 1000
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvasRef.current);
    
    // Start the game automatically
    startGame();

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.dispose();
      }
    };
  }, []);

  const startGame = () => {
    if (gameEngineRef.current && !isGameRunning) {
      gameEngineRef.current.start();
      setIsGameRunning(true);
      onGameStart?.();
    }
  };

  const stopGame = () => {
    if (gameEngineRef.current && isGameRunning) {
      gameEngineRef.current.stop();
      setIsGameRunning(false);
      onGameStop?.();
    }
  };

  const updateGameConfig = (updates: Partial<GameConfig>) => {
    const newConfig = { ...gameConfig, ...updates };
    setGameConfig(newConfig);
    
    if (gameEngineRef.current) {
      gameEngineRef.current.updateConfig(updates);
    }
  };

  const handlePlaneSelect = (planeId: string) => {
    const plane = planeDatabase.current.getPlaneById(planeId);
    if (plane && plane.unlocked && gameEngineRef.current) {
      setSelectedPlaneId(planeId);
      
      // Switch the plane in the game engine
      gameEngineRef.current.switchPlane(plane.properties);
      
      // Update game config if the plane has specific settings
      if (plane.gameSettings) {
        updateGameConfig(plane.gameSettings);
      }
    }
  };

  return (
    <div className="paper-plane-game">
      <canvas 
        ref={canvasRef}
        className="game-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
      />
      
      <div className="game-ui">
        <div className="game-controls">
          <button 
            onClick={isGameRunning ? stopGame : startGame}
            className={`control-button ${isGameRunning ? 'stop' : 'start'}`}
          >
            {isGameRunning ? 'Pause' : 'Start'}
          </button>
          
          <button 
            onClick={() => setShowPlaneSelector(true)}
            className="control-button plane-select"
          >
            Select Plane
          </button>
        </div>
        
        <div className="game-config">
          <div className="config-group">
            <label>Speed:</label>
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.01"
              value={gameConfig.planeSpeed}
              onChange={(e) => updateGameConfig({ planeSpeed: parseFloat(e.target.value) })}
            />
            <span>{gameConfig.planeSpeed.toFixed(2)}</span>
          </div>
          
          <div className="config-group">
            <label>Sensitivity:</label>
            <input
              type="range"
              min="0.001"
              max="0.005"
              step="0.0001"
              value={gameConfig.sensitivity}
              onChange={(e) => updateGameConfig({ sensitivity: parseFloat(e.target.value) })}
            />
            <span>{gameConfig.sensitivity.toFixed(4)}</span>
          </div>
          
          <div className="config-group">
            <label>FOV:</label>
            <input
              type="range"
              min="50"
              max="120"
              step="5"
              value={gameConfig.fieldOfView}
              onChange={(e) => updateGameConfig({ fieldOfView: parseInt(e.target.value) })}
            />
            <span>{gameConfig.fieldOfView}°</span>
          </div>
        </div>
        
        <div className="game-instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Click on the game area to lock the mouse cursor</li>
            <li>Move the mouse to control the paper plane</li>
            <li>Left/Right: Turn the plane</li>
            <li>Up/Down: Pitch the plane</li>
            <li>ESC to release mouse lock</li>
          </ul>
          
          <div className="current-plane-info">
            <h4>Current Plane:</h4>
            <p>{planeDatabase.current.getPlaneById(selectedPlaneId)?.name || 'Unknown'}</p>
          </div>
        </div>
      </div>
      
      <PlaneSelector
        planes={planeDatabase.current.getUnlockedPlanes()}
        selectedPlaneId={selectedPlaneId}
        onPlaneSelect={handlePlaneSelect}
        isVisible={showPlaneSelector}
        onClose={() => setShowPlaneSelector(false)}
      />
    </div>
  );
};
