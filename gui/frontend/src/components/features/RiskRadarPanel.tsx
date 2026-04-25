import React, { useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { ShieldAlert, Activity, Wifi } from 'lucide-react';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

export default function RiskRadarPanel() {
  const [defcon, setDefcon] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [logs, setLogs] = useState<string[]>(['[SYS] Connecting to On-Chain MCP Node...']);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [width, setWidth] = useState(600);
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    const handleResize = () => {
      const el = document.getElementById('radar-container');
      if (el) setWidth(el.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        // Fetch real portfolio data to build the risk graph
        const result = await callMcpEndpoint('MCP_CCXT', 'fetch_balance', { exchange: 'binance' });
        if (!active || !result || !result.total) return;

        const nodes: any[] = [{ id: 'Binance', group: 'exchange', size: 15, color: '#3b82f6' }];
        const links: any[] = [];

        let i = 0;
        let totalRiskValue = 0;

        for (const [coin, amount] of Object.entries(result.total)) {
          if (typeof amount === 'number' && amount > 0) {
            // Simplified risk calculation: non-stablecoins are higher risk
            const isStable = ['USDT', 'USDC', 'DAI', 'BUSD'].includes(coin);
            const color = isStable ? '#10b981' : '#f59e0b';
            const size = Math.max(5, Math.min(20, amount * (isStable ? 1 : 10))); // Scale size for visibility

            nodes.push({ id: coin, group: 'asset', size: size, color: color });
            links.push({ source: 'Binance', target: coin, value: amount, color: color });

            if (!isStable) {
                // If it's a volatile asset, add to risk score (very basic proxy)
                totalRiskValue += amount;
            }
            i++;
          }
        }

        // Add a "Risk Node" representing market volatility
        try {
            let targetSymbol = activeSymbol;
            const taData = await callMcpEndpoint('MCP_TA', 'compute_indicators', { exchange: 'binance', symbol: targetSymbol, timeframe: '1h' });
            if (taData && taData.signal) {
                let statusMsg = '[INFO] Market indicators normal.';
                let newDefcon: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

                if (taData.signal === 'sell') {
                    newDefcon = 'YELLOW';
                    statusMsg = '[WARN] TA indicates potential downturn. Increased risk on volatile assets.';
                } else if (taData.signal === 'buy') {
                    statusMsg = '[INFO] TA indicates bullish momentum. Accumulation phase.';
                }

                // If RSI is extremely low/high, escalate defcon
                if (taData.rsi) {
                    if (taData.rsi > 80) {
                        newDefcon = 'RED';
                        statusMsg = '[ALERT] EXTREME OVERBOUGHT CONDITIONS DETECTED (RSI > 80). High correction risk.';
                    } else if (taData.rsi < 20) {
                        newDefcon = 'RED';
                        statusMsg = '[ALERT] EXTREME OVERSOLD CONDITIONS DETECTED (RSI < 20). Flash crash risk.';
                    }
                }

                if (defcon !== newDefcon) {
                    setDefcon(newDefcon);
                    addLog(statusMsg);
                }
            }
        } catch (taErr) {
            console.warn("Could not fetch TA data for risk assessment", taErr);
        }

        setData({ nodes, links });
      } catch (err) {
        console.error("Failed to fetch risk radar data", err);
        addLog('[ERROR] Connection to exchange nodes failed. Risk unknown.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Check every 30s
    return () => { active = false; clearInterval(interval); };
  }, [defcon, activeSymbol]);


  return (
    <div className="card interactive-element" id="radar-container" style={{
      border: defcon === 'RED' ? '1px solid #ef4444' : defcon === 'YELLOW' ? '1px solid #f59e0b' : '1px solid #10b981',
      boxShadow: defcon === 'RED' ? '0 0 30px rgba(239, 68, 68, 0.2)' : 'none',
      transition: 'all 0.5s ease',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: defcon === 'RED' ? '#ef4444' : 'inherit'}}>
          <ShieldAlert size={20} color={defcon === 'RED' ? '#ef4444' : defcon === 'YELLOW' ? '#f59e0b' : '#10b981'} />
          Smart-Money Risk Radar
        </h3>

        <div style={{display: 'flex', gap: '10px'}}>
          <div style={{
            padding: '4px 12px',
            borderRadius: '4px',
            background: defcon === 'RED' ? 'rgba(239, 68, 68, 0.2)' : defcon === 'YELLOW' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: defcon === 'RED' ? '#ef4444' : defcon === 'YELLOW' ? '#f59e0b' : '#10b981',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            border: `1px solid ${defcon === 'RED' ? '#ef4444' : defcon === 'YELLOW' ? '#f59e0b' : '#10b981'}`
          }}>
            <Activity size={14} />
            DEFCON {defcon === 'GREEN' ? '3: NORMAL' : defcon === 'YELLOW' ? '2: ALERT' : '1: CRITICAL'}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: '350px', background: '#020205', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        {data.nodes.length > 0 ? (
            <ForceGraph3D
            graphData={data}
            nodeLabel="id"
            nodeColor="color"
            nodeRelSize={6}
            linkColor="color"
            linkWidth={(link: any) => link.value > 80 ? 3 : 1}
            linkDirectionalParticles={(link: any) => link.value > 50 ? 2 : 0}
            linkDirectionalParticleSpeed={(link: any) => link.value * 0.0001}
            backgroundColor="#020205"
            showNavInfo={false}
            width={width}
            height={350}
            />
        ) : (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', fontFamily: 'monospace'}}>Scanning Nodes...</div>
        )}

        {/* Overlay HUD */}
        <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
           <div style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontFamily: 'monospace'}}>
             <Wifi size={12} /> ON-CHAIN SYNC
           </div>
        </div>

        {/* Scanner Effect */}
        <div style={{
          position: 'absolute',
          top: '-100%',
          left: 0,
          right: 0,
          height: '100%',
          background: defcon === 'RED' ? 'linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.1), transparent)' : 'linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.1), transparent)',
          animation: 'scanline 4s linear infinite',
          pointerEvents: 'none'
        }} />
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#a3a3a3', height: '80px', overflowY: 'hidden', borderLeft: `3px solid ${defcon === 'RED' ? '#ef4444' : '#334155'}` }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            marginBottom: '4px',
            color: log.includes('[ALERT]') || log.includes('RED') ? '#ef4444' : log.includes('[WARN]') || log.includes('YELLOW') ? '#f59e0b' : '#a3a3a3',
            opacity: 1 - (i * 0.2) // fade out older logs
          }}>
            {'>'} {log}
          </div>
        ))}
      </div>

      {defcon === 'RED' && (
         <button className="btn-primary" style={{marginTop: '1rem', background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)'}}>
           EMERGENCY: HEDGE EXPOSURE TO USDC
         </button>
      )}
    </div>
  );
}
