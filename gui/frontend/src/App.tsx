import React, { useState, useEffect } from 'react'
import PortfolioPanel from './components/PortfolioPanel'
import TickerPanel from './components/TickerPanel'
import OrderPanel from './components/OrderPanel'
import OrdersLogPanel from './components/OrdersLogPanel'
import OracleCopilot from './components/features/OracleCopilot'
import MarketSentimentAnalyzer from "./components/features/MarketSentimentAnalyzer";
import GlobalWeatherSystem from './components/features/GlobalWeatherSystem'
import WhaleSonarSweep from './components/features/WhaleSonarSweep'
import VolatilityMatrix from './components/features/VolatilityMatrix'
import PredictiveGhosting from './components/features/PredictiveGhosting'
import RiskRadarPanel from './components/features/RiskRadarPanel'
import BacktestArenaPanel from './components/features/BacktestArenaPanel'
import ArbitrageWormhole from './components/features/ArbitrageWormhole'
import NewsSingularity from './components/features/NewsSingularity'
import AlgoGridArchitect from './components/features/AlgoGridArchitect'
import QuantumRiskMap from './components/features/QuantumRiskMap'
import WhaleConstellations from './components/features/WhaleConstellations'
import SystemOverview from './components/features/SystemOverview'
import NeuralNetLiquidity from './components/features/NeuralNetLiquidity';
import HoloTopographicOrderBook from './components/features/HoloTopographicOrderBook';
import OrbitalPortfolio from './components/features/OrbitalPortfolio';

import DarkPoolSonar from "./components/features/DarkPoolSonar"
import FlashCrashMatrix from "./components/features/FlashCrashMatrix"
import GalaxyView from "./components/features/GalaxyView"
import SentimentWordCloud from "./components/features/SentimentWordCloud"

import GasHologram from "./components/features/GasHologram"


import { getAuthToken, setAuthToken } from './auth'
import { callMcpEndpoint } from './api_mcp'
import { useActivePortfolioSymbol } from './hooks/useActivePortfolioSymbol'

export default function App() {
  const [sentiment, setSentiment] = useState<'bull' | 'bear' | 'neutral'>('neutral');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [password, setPassword] = useState('');
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

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
            let targetSymbol = activeSymbol;

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

    fetchGlobalSentiment();
    const interval = setInterval(fetchGlobalSentiment, 120000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, [isAuthenticated, activeSymbol]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthToken(password);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #000 100%)' }}>
        <form onSubmit={handleLogin} className="card interactive-element" style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid #334155', boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>





            <div style={{width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981'}}></div>
            <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>SYSTEM AUTHENTICATION</h3>





          </div>
          <p className="small-muted" style={{textAlign: 'center', fontFamily: 'monospace'}}><a href="https://coraxcolab.com" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Corax CoLAB</a> | <a href="https://pellenybe.github.io" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Pelle Nyberg</a> (<a href="https://github.com/PelleNybe" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>GitHub</a>) | <a href="https://cryptop.coraxcolab.com" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>Crypto P's Crypto Circus</a></p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Enter Access Key"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #334155', background: 'rgba(0,0,0,0.5)', color: '#10b981', fontFamily: 'monospace', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #10b981'}
            onBlur={(e) => e.target.style.border = '1px solid #334155'}
          />
          <button type="submit" className="btn-primary" style={{fontFamily: 'monospace', letterSpacing: '2px'}}>INITIALIZE LINK</button>
        </form>





      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020205' }}>
      <GlobalWeatherSystem sentiment={sentiment} />
      {/* Background grid effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 0,
        pointerEvents: 'none'





      }}></div>

      {/* Sentiment Toggles (Manual override) */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 9999, display: 'flex', gap: '10px' }}>
        <button onClick={() => { setSentiment('bull'); document.body.setAttribute('data-sentiment', 'bull'); }} className="btn-outline" style={{ color: '#10b981', borderColor: sentiment === 'bull' ? '#10b981' : '#333' }}>BULL MODE</button>
        <button onClick={() => { setSentiment('neutral'); document.body.setAttribute('data-sentiment', 'neutral'); }} className="btn-outline" style={{ color: '#60a5fa', borderColor: sentiment === 'neutral' ? '#60a5fa' : '#333' }}>NEUTRAL</button>
        <button onClick={() => { setSentiment('bear'); document.body.setAttribute('data-sentiment', 'bear'); }} className="btn-outline" style={{ color: '#ef4444', borderColor: sentiment === 'bear' ? '#ef4444' : '#333' }}>BEAR MODE</button>





      </div>

      <div className="main-grid" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>


        {/* Feature 0: System Overview (Spans full width) */}
        <SystemOverview />
        {/* Feature 1: Neural Net Liquidity */}
        <NeuralNetLiquidity />
        {/* Feature 2: Liquidity Trench */}
        <HoloTopographicOrderBook />



        {/* Feature 1: Arbitrage Wormhole (Spans full width) */}

        {/* NEW WORLD CLASS FEATURES */}


        {/* NEW WORLD CLASS FEATURES */}


        {/* NEW WORLD CLASS FEATURES */}

        <ArbitrageWormhole />

        {/* Feature 3: Algo Grid Architect (Spans full width) */}
        <AlgoGridArchitect />

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PortfolioPanel />
          <TickerPanel />
          {/* Feature 2: News Singularity */}
          <NewsSingularity />
          <PredictiveGhosting />
        {/* Feature 4: Orbital Portfolio */}
        <OrbitalPortfolio />

          <BacktestArenaPanel />
          <WhaleSonarSweep />





        </div>

        {/* Right Column */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Feature 4: Quantum Risk Topography */}
          <QuantumRiskMap />
          <RiskRadarPanel />
          {/* Feature 5: Whale Constellations */}
          <WhaleConstellations />
          <VolatilityMatrix />
          <OrderPanel />
          <OrdersLogPanel />
        </aside>





      </div>

      {/* Original Co-Pilot */}
      <DarkPoolSonar />
<FlashCrashMatrix />
<GalaxyView />
<SentimentWordCloud />
<GasHologram />
<MarketSentimentAnalyzer />
      <OracleCopilot />






    </div>
  )
}
