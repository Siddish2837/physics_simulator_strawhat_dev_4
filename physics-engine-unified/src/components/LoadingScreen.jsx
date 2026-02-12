import React, { useState, useEffect } from 'react';
import { Sparkles, Atom, Zap } from 'lucide-react';

const QUOTES = [
    { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
    { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
    { text: "Nature and Nature's laws lay hid in night: God said, Let Newton be! and all was light.", author: "Alexander Pope" },
    { text: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan" },
    { text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson" },
    { text: "Equipped with his five senses, man explores the universe around him and calls the adventure Science.", author: "Edwin Hubble" },
    { text: "Science is not only a disciple of reason but also one of romance and passion.", author: "Stephen Hawking" },
    { text: "Energy cannot be created or destroyed, it can only be changed from one form to another.", author: "Albert Einstein" },
    { text: "The universe is under no obligation to make sense to you.", author: "Neil deGrasse Tyson" },
    { text: "In science there is only physics; all the rest is stamp collecting.", author: "Ernest Rutherford" }
];

const LoadingScreen = () => {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        setQuote(QUOTES[randomIndex]);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            color: 'white',
            padding: '2rem',
            textAlign: 'center'
        }}>
            {/* Animated Particles/Background Shimmers */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.3,
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: Math.random() * 300 + 100,
                        height: Math.random() * 300 + 100,
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        filter: 'blur(80px)',
                        opacity: 0.1,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `pulse ${Math.random() * 3 + 2}s infinite ease-in-out`
                    }} />
                ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 2.5rem' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 2s linear infinite'
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: '10px',
                        border: '2px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '50%',
                        animation: 'spin 3s linear reverse infinite'
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Atom size={48} color="var(--accent-primary)" style={{ animation: 'float 3s infinite ease-in-out' }} />
                    </div>
                </div>

                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(to right, #fff, var(--text-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Simulating Reality...
                </h2>

                <div style={{
                    marginTop: '2rem',
                    padding: '2rem',
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    <p style={{
                        fontSize: '1.25rem',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        marginBottom: '1rem',
                        color: 'var(--text-primary)'
                    }}>
                        "{quote.text}"
                    </p>
                    <p style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--accent-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        — {quote.author}
                    </p>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'bounce 1.5s infinite 0s' }} />
                    <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'bounce 1.5s infinite 0.2s' }} />
                    <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'bounce 1.5s infinite 0.4s' }} />
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.3; } 40% { transform: translateY(-10px); opacity: 1; } }
                @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.2); opacity: 0.2; } }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
