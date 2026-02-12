import React, { useRef, useEffect } from 'react';
import { X, Clock, Trash2, RotateCcw } from 'lucide-react';

const HistoryDrawer = ({ isOpen, onClose, history, onLoad, onClear }) => {
    const drawerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40vh',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none' // Let clicks pass through outside the drawer
        }}>
            <div
                ref={drawerRef}
                className="glass-panel drawer-enter"
                style={{
                    width: '100%',
                    maxWidth: '800px', // Max width for larger screens
                    height: '100%',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    borderBottom: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    pointerEvents: 'auto', // Re-enable clicks
                    color: 'var(--text-primary)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Simulation History</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {history.length > 0 && (
                            <button
                                onClick={onClear}
                                className="btn"
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.85rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                <Trash2 size={14} /> Clear
                            </button>
                        )}
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {history.length === 0 ? (
                        <div style={{
                            height: '100%', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', opacity: 0.7
                        }}>
                            <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No recent simulations found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {history.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => onLoad(item)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                >
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '500', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.problem}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                                            <span style={{
                                                background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px',
                                                fontSize: '0.75rem'
                                            }}>
                                                {item.topic}
                                            </span>
                                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-icon"
                                        style={{ color: 'var(--accent-primary)', padding: '0.5rem' }}
                                        title="Reload"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryDrawer;
