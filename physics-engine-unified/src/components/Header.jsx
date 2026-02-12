import React from 'react';
import { Atom, ArrowLeft, Menu, Sun, Moon, Clock } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

const Header = ({ onBack, isSidebarOpen, setIsSidebarOpen, theme, setTheme, isHistoryOpen, setIsHistoryOpen }) => {
    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 2rem',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 20
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>

                {(onBack) && (
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            marginRight: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}


                <div style={{ marginRight: '1rem', color: 'var(--accent-primary)' }}>
                    <Atom size={32} />
                </div>
                <div>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.025em'
                    }}>
                        Physics Text <span style={{ color: 'var(--text-secondary)' }}>→</span> Simulation
                    </h1>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* History Toggle */}
                {setIsHistoryOpen && (
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        style={{
                            background: 'none', border: 'none', color: theme === 'dark' ? '#fff' : '#1e1b4b',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            transition: 'color 0.2s, transform 0.2s'
                        }}
                        className="btn-icon"
                        title="View History"
                    >
                        <Clock size={22} />
                    </button>
                )}

                {/* Theme Toggle */}
                {setTheme && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            background: 'none', border: 'none', color: theme === 'dark' ? '#fff' : '#1e1b4b',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            transition: 'color 0.2s, transform 0.2s'
                        }}
                        className="btn-icon"
                        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                )}

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton showName />
                </SignedIn>
            </div>
        </header>
    );
};

export default Header;
