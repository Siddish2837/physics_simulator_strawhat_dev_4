import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Import unified simulation engine
import {
  setupSimulation,
  runSimulation,
  start,
  stop,
  reset as resetSim,
  setZoom as setSimZoom,
  resetView,
  getCanvas,
} from '../simulation-engine/index.js';

// We still need some core functions not exported by index.js
import {
  getCamera,
  pause as pauseSim,
  play as playSim,
  setUnit as setSimUnit,
} from '../simulation-engine/simulation-core.js';



const RightPanel = ({ params, isSimulating, isPlaying, resetSignal, onReset, setIsPlaying, selectedTopic, statusTopic, statusInfo, showError }) => {
  const canvasRef = useRef(null);
  const initializedRef = useRef(false);
  const lastParamsRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hasSimulation, setHasSimulation] = useState(false);
  const [unit, setUnit] = useState('m');

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    setSimUnit(newUnit);
    if (!isPlaying) {
      playSim();
      setTimeout(pauseSim, 50);
    }
  };

  // Initialize + load simulation when canvas becomes available and we have params
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize the engine once
    if (!initializedRef.current) {
      setupSimulation('simCanvas');
      initializedRef.current = true;
    }

    // Load simulation when we have params
    if (params && Object.keys(params).length > 0 && !showError) {
      // Set default unit based on topic if changing
      const isNewTopic = !lastParamsRef.current || lastParamsRef.current.topic !== params.topic;
      if (selectedTopic.toLowerCase().includes('optics') && unit !== 'cm' && isNewTopic) {
        setUnit('cm');
        setSimUnit('cm');
      }

      runSimulation(params, selectedTopic);
      setHasSimulation(true);
      lastParamsRef.current = params;
    }
  }, [params, selectedTopic, showError]);

  // Handle play/pause
  useEffect(() => {
    if (!initializedRef.current) return;
    if (isPlaying) {
      playSim();
    } else {
      pauseSim();
    }
  }, [isPlaying]);

  // Handle reset
  useEffect(() => {
    if (!initializedRef.current || resetSignal === 0) return;
    resetSim();
    resetView();
    setZoom(1);
  }, [resetSignal]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const cam = getCamera();
    const newZoom = Math.min(10, cam.zoom * 1.3);
    setSimZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleZoomOut = useCallback(() => {
    const cam = getCamera();
    const newZoom = Math.max(0.1, cam.zoom / 1.3);
    setSimZoom(newZoom);
    setZoom(newZoom);
  }, []);

  const handleResetView = useCallback(() => {
    resetView();
    setZoom(1);
  }, []);


  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Canvas Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '16px',
      }}>
        {/* Loading Overlay */}
        {isSimulating && (
          <div style={{
            position: 'absolute',
            inset: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            borderRadius: '12px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white'
          }}>
            <div className="loader" style={{ marginBottom: '1rem' }}></div>
            <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>Analyzing Physics...</p>
          </div>
        )}
        {/* Always render canvas but show placeholder when no simulation loaded */}
        {/* Error Overlay */}
        {showError && (
          <div style={{
            position: 'absolute',
            inset: '16px',
            backgroundColor: '#0a0a1a',
            borderRadius: '12px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            border: '1px solid #ff6b6b33'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h3 style={{ color: '#ff6b6b', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Not a physics problem
            </h3>
            <p style={{ color: '#888', maxWidth: '300px', fontSize: '0.9rem' }}>
              Please enter a real physics question using terms like velocity, acceleration, or energy.
            </p>
          </div>
        )}

        {/* Placeholder */}
        {!hasSimulation && !showError && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            color: 'var(--text-secondary)',
            position: 'absolute',
            zIndex: 2,
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}>
              🔬
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Simulation Canvas</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, textAlign: 'center', maxWidth: '300px' }}>
              Describe a physics problem to see it animated here with real-time formulas and interactive controls.
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          id="simCanvas"
          style={{
            width: '100%',
            maxWidth: '900px',
            height: 'auto',
            aspectRatio: '3 / 2',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'grab',
            display: hasSimulation ? 'block' : 'none',
          }}
        />
      </div>

      {/* Controls Bar */}
      {hasSimulation && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
        }}>
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 6px' }} />

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          {/* Zoom Level */}
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontFamily: '"JetBrains Mono", monospace',
            minWidth: '48px',
            textAlign: 'center',
          }}>
            {(zoom * 100).toFixed(0)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Reset View"
          >
            <Maximize2 size={14} />
          </button>

          {/* Unit Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>View Mode:</span>
            <select
              value={unit}
              onChange={handleUnitChange}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: selectedTopic.toLowerCase().includes('optics') ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: selectedTopic.toLowerCase().includes('optics') ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <option value="m">Meters (m)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="mm">Millimeters (mm)</option>
              <option value="km">Kilometers (km)</option>
            </select>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#0a0a1a',
        borderTop: '1px solid #1a1a3e',
        fontSize: '0.7rem',
        color: '#555',
        fontFamily: '"JetBrains Mono", monospace'
      }}>
        <span>{statusTopic}</span>
        <span style={{ color: statusInfo.includes('Running') ? '#4ecdc4' : '#ff9f43' }}>
          {statusInfo}
        </span>
      </div>
    </div>
  );
};

export default RightPanel;
