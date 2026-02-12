import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, BookOpen } from 'lucide-react';
import Dropdown from './Dropdown';

const TOPICS = {
  linear_motion: '1D Motion',
  projectile: 'Projectile Motion',
  forces: 'Forces & Friction',
  energy: 'Energy',
  waves: 'Oscillations & Waves',
  circular_motion: 'Circular Motion',
  collision: 'Collisions',
  optics: 'Optics',
  electricity: 'Electricity',
  magnetism: 'Magnetism',
  thermodynamics: 'Thermodynamics',
  gravitation: 'Gravitation',
  fluid_dynamics: 'Fluid Dynamics',
  lift: 'Lift (Aerodynamics)',
  pulley: 'Pulley Systems',
  elasticity: 'Elasticity',
  multi_pulley: 'Multi-Pulley Systems',
  spring: 'Springs & SHM',
  inclined_plane: 'Inclined Plane',
};

const PARAM_CONFIG = {
  linear_motion: [
    { key: 'velocity', label: 'Initial Velocity', unit: 'm/s', min: 0, max: 100, step: 1 },
    { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', min: -20, max: 20, step: 0.1 },
  ],
  projectile: [
    { key: 'velocity', label: 'Launch Velocity', unit: 'm/s', min: 0, max: 100, step: 1 },
    { key: 'angle', label: 'Launch Angle', unit: '°', min: 0, max: 90, step: 1 },
    { key: 'height', label: 'Initial Height', unit: 'm', min: 0, max: 100, step: 1 },
    { key: 'gravity', label: 'Gravity', unit: 'm/s²', min: 0, max: 20, step: 0.1 },
  ],
  forces: [
    { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 100, step: 0.1 },
    { key: 'appliedForce', label: 'Applied Force', unit: 'N', min: 0, max: 500, step: 1 },
    { key: 'frictionCoeff', label: 'Friction Coeff (μ)', unit: '', min: 0, max: 1, step: 0.01 },
  ],
  energy: [
    { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
    { key: 'velocity', label: 'Initial Velocity', unit: 'm/s', min: 0, max: 50, step: 0.1 },
    { key: 'height', label: 'Initial Height', unit: 'm', min: 0, max: 100, step: 1 },
    { key: 'gravity', label: 'Gravity', unit: 'm/s²', min: 0, max: 20, step: 0.1 },
  ],
  waves: [
    { key: 'amplitude', label: 'Amplitude', unit: 'm', min: 0, max: 10, step: 0.1 },
    { key: 'frequency', label: 'Frequency', unit: 'Hz', min: 0, max: 10, step: 0.1 },
    { key: 'wavelength', label: 'Wavelength', unit: 'm', min: 1, max: 50, step: 1 },
  ],
  circular_motion: [
    { key: 'radius', label: 'Radius', unit: 'm', min: 5, max: 100, step: 1 },
    { key: 'velocity', label: 'Linear Velocity', unit: 'm/s', min: 0, max: 50, step: 1 },
    { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 20, step: 0.1 },
  ],
  collision: [
    { key: 'mass1', label: 'Mass 1', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
    { key: 'velocity1', label: 'Velocity 1', unit: 'm/s', min: -50, max: 50, step: 1 },
    { key: 'mass2', label: 'Mass 2', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
    { key: 'velocity2', label: 'Velocity 2', unit: 'm/s', min: -50, max: 50, step: 1 },
    { key: 'elasticity', label: 'Elasticity (e)', unit: '', min: 0, max: 1, step: 0.01 },
  ],
  optics: [
    { key: 'focalLength', label: 'Focal Length (cm)', unit: 'cm', min: -100, max: 100, step: 1 },
    { key: 'objectDistance', label: 'Object Distance (cm)', unit: 'cm', min: 1, max: 200, step: 1 },
  ],
  electricity: [
    { key: 'charge', label: 'Charge (q)', unit: 'μC', min: -20, max: 20, step: 1 },
    { key: 'electricField', label: 'E Field Strength', unit: 'N/C', min: 0, max: 500, step: 10 },
  ],
  magnetism: [
    { key: 'magneticField', label: 'Magnetic Field (B)', unit: 'T', min: 0, max: 5, step: 0.1 },
    { key: 'charge', label: 'Test Charge', unit: 'μC', min: -10, max: 10, step: 1 },
    { key: 'velocity', label: 'Charge Velocity', unit: 'm/s', min: 0, max: 100, step: 1 },
  ],
  thermodynamics: [
    { key: 'temperature', label: 'Temperature', unit: 'K', min: 0, max: 1000, step: 10 },
    { key: 'volume', label: 'Volume', unit: 'L', min: 1, max: 100, step: 1 },
  ],
  gravitation: [
    { key: 'central_mass', label: 'Central Mass (kg)', unit: 'kg', min: 1e20, max: 1e32, step: 1e20 },
    { key: 'orbital_radius', label: 'Radius (m)', unit: 'm', min: 1e6, max: 1e12, step: 1e6 },
  ],
  fluid_dynamics: [
    { key: 'density', label: 'Density', unit: 'kg/m³', min: 1, max: 5000, step: 1 },
    { key: 'velocity1', label: 'Velocity In', unit: 'm/s', min: 0, max: 50, step: 0.1 },
    { key: 'area1', label: 'Area In', unit: 'm²', min: 0.01, max: 1, step: 0.01 },
    { key: 'area2', label: 'Area Out', unit: 'm²', min: 0.01, max: 1, step: 0.01 },
  ],
  pulley: [
    { key: 'mass1', label: 'Mass 1', unit: 'kg', min: 1, max: 100, step: 1 },
    { key: 'mass2', label: 'Mass 2', unit: 'kg', min: 1, max: 100, step: 1 },
  ],
  multi_pulley: [
    { key: 'num_pulleys', label: 'Number of Pulleys', unit: '', min: 1, max: 8, step: 1 },
    { key: 'load_mass', label: 'Load Mass', unit: 'kg', min: 1, max: 1000, step: 1 },
  ],
  elasticity: [
    { key: 'youngs_modulus', label: 'Young\'s Modulus', unit: 'Pa', min: 1e9, max: 5e11, step: 1e9 },
    { key: 'original_length', label: 'Length', unit: 'm', min: 0.1, max: 10, step: 0.1 },
  ],
  spring: [
    { key: 'springK', label: 'Spring Constant (k)', unit: 'N/m', min: 1, max: 500, step: 1 },
    { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 20, step: 0.1 },
    { key: 'displacement', label: 'Initial Displacement', unit: 'm', min: 0, max: 5, step: 0.1 },
  ],
  inclined_plane: [
    { key: 'inclineAngle', label: 'Incline Angle', unit: '°', min: 0, max: 90, step: 1 },
    { key: 'frictionCoeff', label: 'Friction Coefficient', unit: '', min: 0, max: 1, step: 0.01 },
  ]
};

const TOPIC_EXAMPLES = {
  linear_motion: 'A car starts from rest and accelerates at 2.5 m/s² for 10 seconds. What is its final velocity?',
  projectile: 'A golfer hits a ball at 45 m/s at an angle of 35 degrees from the horizontal.',
  forces: 'A 50kg crate is pushed across a floor with a force of 200N. The kinetic friction is 0.3.',
  energy: 'A 2kg rock is dropped from a cliff 80 meters high. Calculate its kinetic energy just before impact.',
  waves: 'A transverse wave on a string has a frequency of 10Hz and a wavelength of 0.5m.',
  circular_motion: 'A satellite orbits the Earth in a circular path with a radius of 7000km at a constant speed.',
  collision: 'A 3kg ball moving at 5m/s elastically hits a 2kg ball moving in the opposite direction at 2m/s.',
  optics: 'A converging lens has a focal length of 15cm. An object is placed 30cm in front of the lens.',
  electricity: 'Two point charges of 5μC and -3μC are separated by a distance of 0.1 meters.',
  magnetism: 'A proton moves at 2e6 m/s perpendicular to a uniform magnetic field of 0.15 Tesla.',
  thermodynamics: 'A container holds 2 moles of an ideal gas at 300K. The gas is compressed to half its volume.',
  gravitation: 'Calculate the gravitational force between the Earth and the Moon.',
  fluid_dynamics: 'Water flows through a horizontal pipe of varying cross-section. Use Bernoulli\'s principle.',
  lift: 'An airplane wing produces 5000N of lift at a speed of 150km/h.',
  pulley: 'An Atwood machine has two masses of 5kg and 7kg connected by a light string.',
  elasticity: 'A steel wire is stretched by 2mm when a load of 100N is applied.',
  multi_pulley: 'A block and tackle system with 6 pulleys is used to lift a heavy engine.',
  spring: 'A 1kg mass is attached to a spring with k=50N/m and oscillates on a frictionless surface.',
  inclined_plane: 'A 10kg block slides down a 30-degree ramp with a friction coefficient of 0.15.'
};

const LeftPanel = ({
  inputProblem,
  setInputProblem,
  params,
  setParams,
  onGenerate,
  isPlaying,
  setIsPlaying,
  onReset,
  isSimulating,
  selectedTopic,
  setSelectedTopic,
  isSidebarOpen
}) => {
  // Collapse state for sections
  const [isParamsOpen, setIsParamsOpen] = useState(true);

  const getParamValue = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'object' && val.value !== undefined) return val.value;
    return val;
  };

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const currentConfig = PARAM_CONFIG[selectedTopic] || PARAM_CONFIG[TOPICS.MOTION];

  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
  };

  const handleLoadExample = () => {
    const example = TOPIC_EXAMPLES[selectedTopic] || TOPIC_EXAMPLES[TOPICS.MOTION];
    setInputProblem(example);
  };

  const PRESETS = [
    { label: '🏀 Projectile', topic: 'projectile', prompt: 'A ball is thrown at 25 m/s at 60 degrees from a 5m height' },
    { label: '🚗 Linear', topic: 'linear_motion', prompt: 'A car accelerates at 2m/s² from 5m/s for 10 seconds' },
    { label: '🔄 Circular', topic: 'circular_motion', prompt: 'A object moves in a circle of radius 10m at 5m/s' },
    { label: '🌊 Wave', topic: 'waves', prompt: 'A wave with frequency 3Hz and wavelength 2m' },
    { label: '🔍 Optics', topic: 'optics', prompt: 'A lens with focal length 60cm and object at 120cm' },
    { label: '💥 Collision', topic: 'collision', prompt: 'Two objects collide elastically: 3kg at 4m/s and 1kg at -2m/s' },
    { label: '⚡ Energy', topic: 'energy', prompt: 'A 2kg ball falls from 40m height' },
    { label: '🔩 Spring', topic: 'spring', prompt: 'A 2kg mass on a spring with k=50N/m displaced by 1.5m' },
    { label: '⛰️ Incline', topic: 'inclined_plane', prompt: 'A block on a 30 degree incline with friction 0.1' },
    { label: '⚙️ Pulley', topic: 'pulley', prompt: 'An Atwood machine with 10kg and 5kg masses' },
    { label: '🪐 Orbits', topic: 'gravitation', prompt: 'A satellite orbiting a planet' },
    { label: '🌡️ Thermo', topic: 'thermodynamics', prompt: 'Ideal gas at 300K heated to 500K' },
  ];

  const handlePresetClick = (preset) => {
    onGenerate(preset.prompt, preset.topic);
  };

  return (
    <div style={{
      width: isSidebarOpen ? '400px' : '0px',
      minWidth: isSidebarOpen ? '350px' : '0px',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out',
      opacity: isSidebarOpen ? 1 : 0,
      whiteSpace: 'nowrap'
    }}>

      <div style={{ padding: '1.5rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 50 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Physics Topic
          </label>
          <Dropdown
            options={Object.keys(TOPICS).map(key => ({ value: key, label: TOPICS[key] }))}
            value={selectedTopic}
            onChange={(e) => handleTopicChange(e)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Problem Description
            </label>
            <button
              onClick={handleLoadExample}
              style={{
                background: 'none', border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: 'var(--accent-primary)',
                fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                transition: 'all 0.2s',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              <BookOpen size={12} /> Load Example
            </button>
          </div>
          <textarea
            value={inputProblem}
            onChange={(e) => setInputProblem(e.target.value)}
            placeholder="Describe the problem..."
            style={{
              width: '100%',
              height: '80px',
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              resize: 'none',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)'; }}
          />
          <button
            onClick={() => onGenerate()}
            disabled={isSimulating}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isSimulating ? 0.7 : 1,
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.1s, box-shadow 0.2s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isSimulating ? 'Processing...' : (
              <>
                <Sparkles size={18} /> Update Simulation
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{
        padding: '1.5rem',
        paddingTop: '0.5rem',
        overflowY: 'auto',
        flex: 1,
        scrollbarWidth: 'thin',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Quick Presets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePresetClick(p)}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => setIsParamsOpen(!isParamsOpen)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', marginBottom: isParamsOpen ? '1rem' : '0'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Parameters
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isParamsOpen ? '▼' : '▶'}
            </span>
          </div>

          {isParamsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentConfig && currentConfig.map((param) => (
                <div key={param.key} className="param-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{param.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {getParamValue(params[param.key])} {param.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    name={param.key}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={getParamValue(params[param.key])}
                    onChange={handleSliderChange}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              ))}

              <button
                onClick={onReset}
                className="btn"
                style={{
                  marginTop: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  width: '100%',
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Reset Parameters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeftPanel;
