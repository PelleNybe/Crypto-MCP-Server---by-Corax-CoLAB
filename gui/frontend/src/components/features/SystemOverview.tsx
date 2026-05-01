import React, { useState, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';
import { Activity, Server, Database, ShieldCheck, Zap } from 'lucide-react';

export default function SystemOverview() {
  const [statuses, setStatuses] = useState<Record<string, 'online' | 'offline' | 'checking'>>({
    MCP_CCXT: 'checking',
    MCP_PORTFOLIO: 'checking',
    MCP_TA: 'checking',
    MCP_LLM: 'checking'
  });

  useEffect(() => {
    let active = true;

    const checkStatus = async (mcp: string, method: string, params: any = {}) => {
      try {
        await callMcpEndpoint(mcp, method, params);
        if (active) setStatuses(prev => ({ ...prev, [mcp]: 'online' }));
      } catch (err) {
        if (active) setStatuses(prev => ({ ...prev, [mcp]: 'offline' }));
      }
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const pingAll = async () => {
      setStatuses({
        MCP_CCXT: 'checking',
        MCP_PORTFOLIO: 'checking',
        MCP_TA: 'checking',
        MCP_LLM: 'checking'
      });
      // Try to call a benign method on each
      try {
        await Promise.allSettled([
          checkStatus('MCP_CCXT', 'get_ticker', { exchange: 'binance', symbol: 'BTC/USDT' }),
          checkStatus('MCP_PORTFOLIO', 'portfolio_value', { exchanges: ['binance'] }),
          checkStatus('MCP_TA', 'compute_indicators', { exchange: 'binance', symbol: 'BTC/USDT', timeframe: '1h' }),
          checkStatus('MCP_LLM', 'generate_text', { prompt: 'ping', max_tokens: 5 })
        ]);
      } finally {
        if (active) {
          timeoutId = setTimeout(pingAll, 60000); // Check every minute
        }
      }
    };

    pingAll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const StatusIndicator = ({ status }: { status: string }) => {
    const color = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#f59e0b';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
          animation: status === 'checking' ? 'pulse 1s infinite' : 'none'
        }} />
        <span style={{ color: color, textTransform: 'uppercase', fontSize: '12px', fontFamily: 'monospace' }}>
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', border: '1px solid #334155', background: 'rgba(2, 2, 5, 0.8)', padding: '20px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: '#10b981', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={24} /> System Core Status
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
              <Activity size={16} /> AUTO-PINGING NODES
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>EXCHANGE LINK (CCXT)</span>
              <StatusIndicator status={statuses.MCP_CCXT} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Handles execution and live orderbook data.</div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>PORTFOLIO SYNC</span>
              <StatusIndicator status={statuses.MCP_PORTFOLIO} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Aggregates cross-exchange balances.</div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>QUANT ENGINE (TA)</span>
              <StatusIndicator status={statuses.MCP_TA} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Calculates indicators and Monte Carlo paths.</div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>NEURAL NET (LLM)</span>
              <StatusIndicator status={statuses.MCP_LLM} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Processes sentiment and copilot commands.</div>
        </div>
      </div>
    </div>
  );
}
