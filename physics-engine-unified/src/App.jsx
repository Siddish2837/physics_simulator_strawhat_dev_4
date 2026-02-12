import { useState, useEffect } from 'react'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import ChatInterface from './components/ChatInterface'
import BackgroundAnimation from './components/BackgroundAnimation';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import HistoryDrawer from './components/HistoryDrawer';
import LoadingScreen from './components/LoadingScreen';

function App() {
    const { getToken } = useAuth();
    const [viewMode, setViewMode] = useState('chat') // 'chat' | 'simulation'
    const [inputProblem, setInputProblem] = useState('')
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open
    const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
    const [history, setHistory] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [selectedTopic, setSelectedTopic] = useState('linear_motion'); // Default topic

    const [params, setParams] = useState({
        velocity: 20,
        angle: 45,
        gravity: 9.8,
        // Default params for other modes can be computed or set in LeftPanel
    })

    const [isSimulating, setIsSimulating] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [resetSignal, setResetSignal] = useState(0)
    const [statusTopic, setStatusTopic] = useState('Topic: —')
    const [statusInfo, setStatusInfo] = useState('Ready')
    const [showError, setShowError] = useState(false)

    const PHYSICS_KEYWORDS = [
        'velocity', 'speed', 'acceleration', 'force', 'mass', 'gravity',
        'projectile', 'throw', 'thrown', 'launch', 'ball', 'bullet', 'fired',
        'wave', 'frequency', 'amplitude', 'wavelength', 'oscillat', 'hertz',
        'lens', 'mirror', 'refract', 'reflect', 'snell', 'optic', 'focal', 'prism', 'light', 'ray',
        'circular', 'orbit', 'rotation', 'angular', 'centripetal', 'revolv', 'radius',
        'energy', 'kinetic', 'potential', 'joule', 'watt', 'power', 'work',
        'collision', 'elastic', 'inelastic', 'momentum', 'impulse',
        'electric', 'charge', 'voltage', 'current', 'ohm', 'coulomb', 'capacitor', 'resistor',
        'magnet', 'magnetic', 'tesla', 'inducto', 'solenoid', 'wire',
        'linear', 'motion', 'car', 'vehicle', 'train', 'object',
        'newton', 'friction', 'drag', 'tension', 'spring', 'hooke',
        'pendulum', 'simple harmonic', 'shm',
        'angle', 'degree', 'm/s', 'km/h', 'kg', 'meter', 'displacement',
        'height', 'distance', 'fall', 'drop', 'rise', 'incline', 'slope',
        'pressure', 'density', 'buoyancy', 'fluid', 'torque', 'lever',
        'friction', 'coefficient', 'rough', 'smooth', 'surface', 'sliding', 'static',
        'incline', 'slope', 'ramp', 'hill',
        'bernoulli', 'pipe', 'flow', 'continuity',
        'lift', 'wing', 'airfoil', 'aerodynamic', 'airplane', 'fly',
        'lorentz', 'cyclotron', 'electron', 'proton',
        'spring', 'hooke', 'oscillation', 'elastic', 'restoring',
        'pulley', 'rope', 'atwood', 'tension',
        'orbit', 'planet', 'satellite', 'solar', 'gravitation', 'kepler',
        'temperature', 'heat', 'gas', 'mole', 'ideal gas', 'piston', 'thermal',
        'stress', 'strain', 'modulus', 'deformation', 'stretch', 'young',
    ];

    const isPhysicsInput = (text) => {
        const lower = text.toLowerCase();
        return PHYSICS_KEYWORDS.some(kw => lower.includes(kw));
    };

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('physics_sim_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('physics_sim_history', JSON.stringify(history));
    }, [history]);

    const addToHistory = (problem, topic) => {
        const newItem = {
            id: Date.now(),
            problem,
            topic,
            timestamp: new Date().toISOString()
        };
        // Keep last 10
        setHistory(prev => [newItem, ...prev].slice(0, 10));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const loadHistoryItem = (item) => {
        setInputProblem(item.problem);
        setSelectedTopic(item.topic);
        setIsHistoryOpen(false);
        // Trigger simulation
        handleChatGenerate(item.problem, item.topic);
        // Note: handleChatGenerate might need update to accept topic or just problem
    };

    const handleChatGenerate = async (prompt, topicOverride) => {
        setInputProblem(prompt)
        if (topicOverride) setSelectedTopic(topicOverride);

        if (!isPhysicsInput(prompt)) {
            setShowError(true);
            setStatusInfo('🚫 Not a physics problem');
            return;
        }

        setShowError(false);
        setIsSimulating(true)
        setStatusInfo('🔄 Analyzing...');

        try {
            const token = await getToken();
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: prompt })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`Server returned ${response.status}: ${errData.error || 'Unknown error'}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to parse physics problem');
            }

            const data = result.data;

            if (data.topic) {
                setSelectedTopic(data.topic);
                setStatusTopic(`Topic: ${data.topic}`);
            }

            setParams(data);
            setStatusInfo('🟢 Running');
            setViewMode('simulation');
            setIsPlaying(true);
        } catch (error) {
            console.error(error);
            setStatusInfo('❌ Analysis failed');
            alert("Backend Error: " + error.message);
        } finally {
            setIsSimulating(false);
        }
    }

    const handleBackToChat = () => {
        setIsPlaying(false)
        setViewMode('chat')
    }

    const handleReset = () => {
        setIsPlaying(false)
        setResetSignal(prev => prev + 1)
        // Reset Logic handled in LeftPanel via params
    }

    // Pass this down to update params from LeftPanel
    const updateParams = (newParams) => {
        setParams(prev => ({ ...prev, ...newParams }))
    }

    return (
        <div className="app-container" data-theme={theme}>
            {isSimulating && <LoadingScreen />}
            <div className="gradient-overlay" />
            <BackgroundAnimation topic={selectedTopic} theme={theme} />
            <Header
                onBack={viewMode === 'simulation' ? handleBackToChat : undefined}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                theme={theme}
                setTheme={setTheme}
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
            />

            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onLoad={loadHistoryItem}
                onClear={clearHistory}
            />

            <SignedOut>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Visualize Physics Problems Instantly
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        Transform text-based physics word problems into interactive, real-time simulations powered by AI.
                        Sign in to start exploring.
                    </p>
                    <SignInButton mode="modal">
                        <button className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                            Get Started
                        </button>
                    </SignInButton>
                </div>
            </SignedOut>

            <SignedIn>
                <div className="main-layout">
                    {viewMode === 'chat' ? (
                        <ChatInterface
                            onGenerate={(prompt, topic) => handleChatGenerate(prompt, topic)}
                            addToHistory={addToHistory}
                            selectedTopic={selectedTopic}
                            input={inputProblem}
                            setInput={setInputProblem}
                        />
                    ) : (
                        <>
                            <LeftPanel
                                theme={theme}
                                params={params}
                                setParams={setParams}
                                isSimulating={isSimulating}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                onReset={handleReset}
                                onGenerate={(prompt, topic) => handleChatGenerate(prompt || inputProblem, topic)}
                                inputProblem={inputProblem}
                                setInputProblem={setInputProblem}
                                selectedTopic={selectedTopic}
                                setSelectedTopic={setSelectedTopic}
                                isSidebarOpen={isSidebarOpen}
                            />
                            <RightPanel
                                params={params}
                                isSimulating={isSimulating}
                                isPlaying={isPlaying}
                                resetSignal={resetSignal}
                                onReset={handleReset} // Pass reset to RightPanel for floating controls
                                setIsPlaying={setIsPlaying} // Pass control to RightPanel
                                selectedTopic={selectedTopic}
                                statusTopic={statusTopic}
                                statusInfo={statusInfo}
                                showError={showError}
                            />
                        </>
                    )}
                </div>
            </SignedIn>
        </div>
    )
}

export default App
