import { useState, useEffect } from 'react'
import React from 'react'
import { Loader } from 'lucide-react'
import './styles.css'
import socket from './socket'

import PortfolioPanel from './components/PortfolioPanel'
import TickerPanel from './components/TickerPanel'
import OrderPanel from './components/OrderPanel'
import OrdersLogPanel from './components/OrdersLogPanel'

const RiskRadarPanel = React.lazy(() => import('./components/features/RiskRadarPanel'))
import MarketSentimentAnalyzer from './components/features/MarketSentimentAnalyzer'
import AlgoGridArchitect from './components/features/AlgoGridArchitect'
import BacktestArenaPanel from './components/features/BacktestArenaPanel'
import SystemOverview from './components/features/SystemOverview'
import NeuralNetLiquidity from './components/features/NeuralNetLiquidity'

import DarkPoolSonar from './components/features/DarkPoolSonar'
import FlashCrashMatrix from './components/features/FlashCrashMatrix'
const GalaxyView = React.lazy(() => import('./components/features/GalaxyView'))
import SentimentWordCloud from './components/features/SentimentWordCloud'
const GasHologram = React.lazy(() => import('./components/features/GasHologram'))

import VolatilityMatrix from './components/features/VolatilityMatrix'
import WhaleSonarSweep from './components/features/WhaleSonarSweep'
const WhaleConstellations = React.lazy(() => import('./components/features/WhaleConstellations'))
import PredictiveGhosting from './components/features/PredictiveGhosting'
import NewsSingularity from './components/features/NewsSingularity'
const HoloTopographicOrderBook = React.lazy(() => import('./components/features/HoloTopographicOrderBook'))
const QuantumRiskMap = React.lazy(() => import('./components/features/QuantumRiskMap'))
import OrbitalPortfolio from './components/features/OrbitalPortfolio'
import OracleCopilot from './components/features/OracleCopilot'
const ArbitrageWormhole = React.lazy(() => import('./components/features/ArbitrageWormhole'))

import GlobalWeatherSystem from './components/features/GlobalWeatherSystem'

import { TiltWrapper } from './components/TiltWrapper'
import { setAuthToken } from './auth'
import NeonToasts from './components/NeonToasts'

const MatrixRain = React.memo(() => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%&|<>'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    let rafId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.1, pointerEvents: 'none' }} />;
});

export default function App() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, analytics, system
  const [sentiment, setSentiment] = useState<'bull' | 'bear' | 'neutral'>('neutral')

  useEffect(() => {
    const handleConnect = () => setSocketConnected(true)
    const handleDisconnect = () => setSocketConnected(false)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    if(socket.connected) { setTimeout(() => setSocketConnected(true), 0) }
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [])

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
          <p className="small-muted" style={{textAlign: 'center', fontFamily: 'monospace'}}><a href="https://coraxcolab.com" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>Corax CoLAB</a> | <a href="https://pellenybe.github.io" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>Pelle Nyberg</a> (<a href="https://github.com/PelleNybe" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>GitHub</a>) | <a href="https://cryptop.coraxcolab.com" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>Crypto P's Crypto Circus</a></p>
          <label htmlFor="accessKeyInput" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Enter Access Key</label>
          <input
            id="accessKeyInput"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Enter Access Key"
            title="Enter Access Key"
            placeholder="Enter Access Key"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #334155', background: 'rgba(0,0,0,0.5)', color: '#10b981', fontFamily: 'monospace', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #10b981'}
            onBlur={(e) => e.target.style.border = '1px solid #334155'}
            disabled={isLoggingIn}
          />
          <button
            aria-label="Submit Authentication"
            type="submit"
            className="btn-primary"
            style={{fontFamily: 'monospace', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}
            disabled={isLoggingIn}
            aria-busy={isLoggingIn}
            aria-live="polite"
            aria-atomic="true"
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
      <NeonToasts />
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
          aria-label="Dashboard Tab"
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
          aria-label="Analytics Tab"
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
          aria-label="System Logs Tab"
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




      <React.Suspense fallback={<div style={{color: '#10b981', textAlign: 'center', padding: '20px'}}>Loading Holographic Components...</div>}>
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
