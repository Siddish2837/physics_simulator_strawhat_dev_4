import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({ options, value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        const val = typeof option === 'object' ? option.value : option;
        onChange({ target: { value: val } }); // Mimic event object for compatibility
        setIsOpen(false);
    };

    const getDisplayLabel = () => {
        if (!options || options.length === 0) return value;
        const option = options.find(o => (typeof o === 'object' ? o.value : o) === value);
        return typeof option === 'object' ? option.label : (option || value);
    };

    return (
        <div className="relative" ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 50 }}>
            {label && (
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {label}
                </label>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                }}
            >
                <span style={{ fontWeight: '500' }}>{getDisplayLabel()}</span>
                <ChevronDown size={16} style={{
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-secondary)'
                }} />
            </div>

            {/* Animated Menu */}
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'var(--bg-secondary)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                overflowY: 'auto',
                maxHeight: '300px',
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0) scaleY(1)' : 'translateY(-10px) scaleY(0.95)',
                transformOrigin: 'top',
                transition: 'all 0.2s ease-out',
                pointerEvents: isOpen ? 'auto' : 'none',
                zIndex: 1000
            }}>
                {options.map((option) => {
                    const optValue = typeof option === 'object' ? option.value : option;
                    const optLabel = typeof option === 'object' ? option.label : option;
                    return (
                        <div
                            key={optValue}
                            onClick={() => handleSelect(option)}
                            className="dropdown-item"
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: 'var(--text-primary)',
                                transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                        >
                            {optLabel}
                            {value === optValue && <Check size={14} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dropdown;
