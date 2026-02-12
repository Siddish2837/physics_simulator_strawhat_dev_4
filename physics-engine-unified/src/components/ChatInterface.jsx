import React from 'react';
import { Send, Sparkles, Zap, Activity, Box } from 'lucide-react';

const ChatInterface = ({ onGenerate, addToHistory, input, setInput }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onGenerate(input);
            if (addToHistory) addToHistory(input.trim(), 'General');
        }
    };

    const handleChipClick = (topic, text) => {
        setInput(text);
        onGenerate(text, topic);
        if (addToHistory) addToHistory(text, topic);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            padding: '1rem',
            position: 'relative',
            zIndex: 10 // Content layer
        }}>

            {/* Hero Section */}
            <div style={{
                textAlign: 'center', marginBottom: '2.5rem', maxWidth: '700px',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.75rem', borderRadius: '20px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    marginBottom: '1.5rem',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
                }}>
                    <Sparkles size={32} color="var(--accent-primary)" />
                </div>

                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                }}>
                    Physics Text <span style={{ color: 'var(--accent-primary)' }}>→</span> Simulation
                </h1>

                <p style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    margin: '0 auto',
                    fontWeight: 500,
                    opacity: 0.8,
                }}>
                    Describe any mechanics problem, and watch it come to life with an interactive simulation.
                </p>
            </div>

            {/* Input Section */}
            <div style={{ width: '100%', maxWidth: '750px', position: 'relative' }}>
                <form onSubmit={handleSubmit} className="glass-panel" style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    borderRadius: '24px',
                    padding: '0.75rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                    border: '1px solid var(--border-color)',
                }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <div style={{ padding: '0.75rem 0.5rem 0 0.5rem' }}>
                        <label htmlFor="image-upload" style={{ cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                        >
                            <Sparkles size={20} color="var(--text-secondary)" />
                        </label>
                        <input id="image-upload" type="file" accept="image/*" style={{ display: 'none' }} />
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="E.g., A 5kg block slides down a 30° frictionless incline..."
                        style={{
                            flex: 1,
                            minHeight: '60px',
                            maxHeight: '200px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.1rem',
                            resize: 'none',
                            fontFamily: 'inherit',
                            outline: 'none',
                            padding: '0.5rem',
                            lineHeight: 1.5
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="btn-primary"
                        style={{
                            borderRadius: '50%',
                            width: '42px',
                            height: '42px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: input.trim() ? 1 : 0.5,
                            cursor: input.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            marginTop: '0.25rem'
                        }}
                    >
                        <Send size={20} />
                    </button>
                </form>

                {/* Example Chips */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                        { icon: <Activity size={16} />, label: "Projectile Motion", text: "Simulate a projectile launched at 45 degrees with 20m/s velocity", topic: "Projectile" },
                        { icon: <Zap size={16} />, label: "Energy Flow", text: "Visualize kinetic and potential energy transformation", topic: "Energy" },
                        { icon: <Box size={16} />, label: "Collisions", text: "Simulate an elastic collision between a 2kg ball and a 1kg ball", topic: "Collisions" },
                        { icon: <Activity size={16} />, label: "Optics", text: "Light passing from air to glass with 30 degree incidence", topic: "Optics" }
                    ].map((chip) => (
                        <button
                            key={chip.label}
                            onClick={() => handleChipClick(chip.topic, chip.text)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem',
                                fontSize: '0.9rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '30px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 500,
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span style={{ opacity: 0.7 }}>{chip.icon}</span>
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
