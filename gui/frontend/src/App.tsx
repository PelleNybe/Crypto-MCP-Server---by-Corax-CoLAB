import React, { useState, useEffect } from 'react'
import PortfolioPanel from './components/PortfolioPanel'
import TickerPanel from './components/TickerPanel'
import OrderPanel from './components/OrderPanel'
import OrdersLogPanel from './components/OrdersLogPanel'

import RiskRadarPanel from './components/features/RiskRadarPanel'
import BacktestArenaPanel from './components/features/BacktestArenaPanel'

// New Features
import OnChainGalaxyMap from './components/features/OnChainGalaxyMap'
import HolographicAICore from './components/features/HolographicAICore'
import CandleCityscape from './components/features/CandleCityscape'
import BotSwarmRadar from './components/features/BotSwarmRadar'
import DefiWormholeExplorer from './components/features/DefiWormholeExplorer'

import { getAuthToken, setAuthToken } from './auth'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  useEffect(() => {
    const handleAuthError = () => setIsAuthenticated(false);
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthToken(password);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #000 100%)' }}>
        <form onSubmit={handleLogin} className="card" style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid #334155', boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
            <div style={{width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981'}}></div>
            <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>SYSTEM AUTHENTICATION</h3>
          </div>
          <p className="small-muted" style={{textAlign: 'center', fontFamily: 'monospace'}}>Corax CoLAB - Edge AI Protocol</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ACCESS_KEY"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #334155', background: 'rgba(0,0,0,0.5)', color: '#10b981', fontFamily: 'monospace', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #10b981'}
            onBlur={(e) => e.target.style.border = '1px solid #334155'}
          />
          <button type="submit" className="btn-primary" style={{fontFamily: 'monospace', letterSpacing: '2px'}}>INITIALIZE LINK</button>
        </form>
      </div>
    );
  }

  const renderContent = () => {
      if (activeTab === 'DASHBOARD') {
          return (
              <div className="main-grid" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <PortfolioPanel />
                      <TickerPanel />
                      <BacktestArenaPanel />
                  </div>

                  {/* Right Column */}
                  <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <RiskRadarPanel />
                      <OrderPanel />
                      <OrdersLogPanel />
                  </aside>
              </div>
          )
      } else if (activeTab === 'COMMAND_CENTER') {
           return (
              <div className="main-grid" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
                  <CandleCityscape />
                  <DefiWormholeExplorer />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <HolographicAICore />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <BotSwarmRadar />
                      <OnChainGalaxyMap />
                  </div>
              </div>
          )
      }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020205' }}>
      {/* Background grid effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Navigation Layer */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px 0', borderBottom: '1px solid rgba(0,255,255,0.1)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
          <button
            className="btn-outline"
            style={{
                borderColor: activeTab === 'DASHBOARD' ? '#00ffff' : 'rgba(255,255,255,0.2)',
                color: activeTab === 'DASHBOARD' ? '#00ffff' : '#fff',
                boxShadow: activeTab === 'DASHBOARD' ? '0 0 10px rgba(0,255,255,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('DASHBOARD')}
          >
              CORE DASHBOARD
          </button>
          <button
            className="btn-outline"
            style={{
                borderColor: activeTab === 'COMMAND_CENTER' ? '#ff00ff' : 'rgba(255,255,255,0.2)',
                color: activeTab === 'COMMAND_CENTER' ? '#ff00ff' : '#fff',
                boxShadow: activeTab === 'COMMAND_CENTER' ? '0 0 10px rgba(255,0,255,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('COMMAND_CENTER')}
          >
              AI COMMAND CENTER
          </button>
      </div>

      {renderContent()}

    </div>
  )
}
