import MatrixRain from "./components/MatrixRain";
import React, { useState, useEffect, Suspense } from 'react'
const PortfolioPanel = React.lazy(() => import('./components/PortfolioPanel'));const TickerPanel = React.lazy(() => import('./components/TickerPanel'));const OrderPanel = React.lazy(() => import('./components/OrderPanel'));const OrdersLogPanel = React.lazy(() => import('./components/OrdersLogPanel'));const OracleCopilot = React.lazy(() => import('./components/features/OracleCopilot'));const MarketSentimentAnalyzer = React.lazy(() => import('./components/features/MarketSentimentAnalyzer'));
const GlobalWeatherSystem = React.lazy(() => import('./components/features/GlobalWeatherSystem'));const WhaleSonarSweep = React.lazy(() => import('./components/features/WhaleSonarSweep'));const VolatilityMatrix = React.lazy(() => import('./components/features/VolatilityMatrix'));const PredictiveGhosting = React.lazy(() => import('./components/features/PredictiveGhosting'));const RiskRadarPanel = React.lazy(() => import('./components/features/RiskRadarPanel'));const BacktestArenaPanel = React.lazy(() => import('./components/features/BacktestArenaPanel'));const ArbitrageWormhole = React.lazy(() => import('./components/features/ArbitrageWormhole'));const NewsSingularity = React.lazy(() => import('./components/features/NewsSingularity'));const AlgoGridArchitect = React.lazy(() => import('./components/features/AlgoGridArchitect'));const QuantumRiskMap = React.lazy(() => import('./components/features/QuantumRiskMap'));const WhaleConstellations = React.lazy(() => import('./components/features/WhaleConstellations'));const SystemOverview = React.lazy(() => import('./components/features/SystemOverview'));const NeuralNetLiquidity = React.lazy(() => import('./components/features/NeuralNetLiquidity'));
const HoloTopographicOrderBook = React.lazy(() => import('./components/features/HoloTopographicOrderBook'));
const OrbitalPortfolio = React.lazy(() => import('./components/features/OrbitalPortfolio'));

const DarkPoolSonar = React.lazy(() => import('./components/features/DarkPoolSonar'));const FlashCrashMatrix = React.lazy(() => import('./components/features/FlashCrashMatrix'));const GalaxyView = React.lazy(() => import('./components/features/GalaxyView'));const SentimentWordCloud = React.lazy(() => import('./components/features/SentimentWordCloud'));const GasHologram = React.lazy(() => import('./components/features/GasHologram'));import { getAuthToken, setAuthToken } from './auth'
import socket from './socket'
import { callMcpEndpoint } from './api_mcp'
import { useActivePortfolioSymbol } from './hooks/useActivePortfolioSymbol'
import { Loader } from 'lucide-react';
import TiltWrapper from './components/TiltWrapper';

export default function App() {
  const [sentiment, setSentiment] = useState<'bull' | 'bear' | 'neutral'>('neutral');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'system'>('dashboard');
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();


  useEffect(() => {
    function onConnect() { setSocketConnected(true); }
    function onDisconnect() { setSocketConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    const handleAuthError = () => setIsAuthenticated(false);
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  // Auto-update global sentiment based on TA data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchGlobalSentiment = async () => {
        try {
            const targetSymbol = activeSymbol;

            const taData = await callMcpEndpoint('MCP_TA', 'compute_indicators', { exchange: 'binance', symbol: targetSymbol, timeframe: '1h' });
            if (taData && taData.signal) {
                if (taData.signal === 'buy') { setSentiment('bull'); document.body.setAttribute('data-sentiment', 'bull'); }
                else if (taData.signal === 'sell') { setSentiment('bear'); document.body.setAttribute('data-sentiment', 'bear'); }
                else { setSentiment('neutral'); document.body.setAttribute('data-sentiment', 'neutral'); }
            }
        } catch (err) {
            console.error("Failed to fetch TA for global sentiment", err);
        }
    };


    let timeoutId: NodeJS.Timeout;

    const fetchGlobalSentimentWithPolling = async () => {
      try {
        await fetchGlobalSentiment();
      } finally {
        timeoutId = setTimeout(fetchGlobalSentimentWithPolling, 120000);
      }
    };

    fetchGlobalSentimentWithPolling();
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, activeSymbol]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    // Simulate slight delay for feedback
    setTimeout(() => {
      setAuthToken(password);
      setIsAuthenticated(true);
      setIsLoggingIn(false);
    }, 500);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #000 100%)' }}>
        <TiltWrapper>
        <form onSubmit={handleLogin} className="card interactive-element" style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid #334155', boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
            <div style={{width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981'}}></div>
            <h3 className="glitch" data-text="SYSTEM AUTHENTICATION" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "2px", color: "#fff" }}>SYSTEM AUTHENTICATION</h3>
          </div>
          <p className="small-muted" style={{textAlign: 'center', fontFamily: 'monospace'}}><a href="https://coraxcolab.com" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Corax CoLAB</a> | <a href="https://pellenybe.github.io" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Pelle Nyberg</a> (<a href="https://github.com/PelleNybe" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>GitHub</a>) | <a href="https://cryptop.coraxcolab.com" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Crypto P's Crypto Circus</a></p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Enter Access Key"
            title="Enter Access Key"
            Enter="Enter Access Key"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #334155', background: 'rgba(0,0,0,0.5)', color: '#10b981', fontFamily: 'monospace', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #10b981'}
            onBlur={(e) => e.target.style.border = '1px solid #334155'}
            disabled={isLoggingIn}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{fontFamily: 'monospace', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}
            disabled={isLoggingIn}
            aria-busy={isLoggingIn}
          >
            {isLoggingIn ? <><Loader size={16} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} /> INITIALIZING...</> : "INITIALIZE LINK"}
          </button>
        </form>
        </TiltWrapper>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020205' }}>
      <GlobalWeatherSystem sentiment={sentiment} />
      <MatrixRain />
      <div className="bg-sentiment" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}></div>
      <div className="scanline-effect"></div>
      {/* Background grid effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Sentiment Toggles (Manual override) */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 9999, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: socketConnected ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${socketConnected ? '#10b981' : '#ef4444'}` }}></div>
          <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>{socketConnected ? 'WS LIVE' : 'WS DISCONNECTED'}</span>
        </div>
        <button aria-label="Set Bull Market Mode" aria-pressed={sentiment === 'bull'} onClick={() => { setSentiment('bull'); document.body.setAttribute('data-sentiment', 'bull'); }} className="btn-outline" style={{ color: '#10b981', borderColor: sentiment === 'bull' ? '#10b981' : '#333' }}>BULL MODE</button>
        <button aria-label="Set Neutral Market Mode" aria-pressed={sentiment === 'neutral'} onClick={() => { setSentiment('neutral'); document.body.setAttribute('data-sentiment', 'neutral'); }} className="btn-outline" style={{ color: '#60a5fa', borderColor: sentiment === 'neutral' ? '#60a5fa' : '#333' }}>NEUTRAL</button>
        <button aria-label="Set Bear Market Mode" aria-pressed={sentiment === 'bear'} onClick={() => { setSentiment('bear'); document.body.setAttribute('data-sentiment', 'bear'); }} className="btn-outline" style={{ color: '#ef4444', borderColor: sentiment === 'bear' ? '#ef4444' : '#333' }}>BEAR MODE</button>
      </div>


      {/* Cyberpunk Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px', position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '20px', background: 'rgba(2, 2, 5, 0.8)', backdropFilter: 'blur(10px)' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="btn-outline"
          style={{
            borderColor: activeTab === 'dashboard' ? 'var(--primary-border)' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'dashboard' ? 'var(--primary-border)' : '#fff',
            boxShadow: activeTab === 'dashboard' ? '0 0 10px var(--primary-glow)' : 'none',
            fontSize: '16px', padding: '10px 20px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal'
          }}
        >DASHBOARD</button>
        <button
          onClick={() => setActiveTab('analytics')}
          className="btn-outline"
          style={{
            borderColor: activeTab === 'analytics' ? 'var(--primary-border)' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'analytics' ? 'var(--primary-border)' : '#fff',
            boxShadow: activeTab === 'analytics' ? '0 0 10px var(--primary-glow)' : 'none',
            fontSize: '16px', padding: '10px 20px', fontWeight: activeTab === 'analytics' ? 'bold' : 'normal'
          }}
        >ANALYTICS</button>
        <button
          onClick={() => setActiveTab('system')}
          className="btn-outline"
          style={{
            borderColor: activeTab === 'system' ? 'var(--primary-border)' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'system' ? 'var(--primary-border)' : '#fff',
            boxShadow: activeTab === 'system' ? '0 0 10px var(--primary-glow)' : 'none',
            fontSize: '16px', padding: '10px 20px', fontWeight: activeTab === 'system' ? 'bold' : 'normal'
          }}
        >SYSTEM LOGS</button>
      </div>

      <div className="main-grid" style={{ position: 'relative', zIndex: 1, padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <React.Suspense fallback={<div style={{color: '#10b981', textAlign: 'center', gridColumn: '1 / -1'}}>Loading Dashboard Elements...</div>}>




        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PortfolioPanel />
              <TickerPanel />
              <OrderPanel />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <OrbitalPortfolio />
              <HoloTopographicOrderBook />
              <NeuralNetLiquidity />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <QuantumRiskMap />
              <RiskRadarPanel />
              <VolatilityMatrix />
              <FlashCrashMatrix />
              <MarketSentimentAnalyzer />
              <SentimentWordCloud />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <WhaleSonarSweep />
              <WhaleConstellations />
              <DarkPoolSonar />
              <GasHologram />
              <PredictiveGhosting />
              <NewsSingularity />
              <GalaxyView />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SystemOverview />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <OrdersLogPanel />
              <AlgoGridArchitect />
            </div>
            <ArbitrageWormhole />
            <BacktestArenaPanel />
            <OracleCopilot />
          </div>
        )}

      </React.Suspense>
      </div>
    </div>
  )
}
