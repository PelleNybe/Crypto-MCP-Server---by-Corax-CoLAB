import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Bot, Pause, Play, RefreshCw, ShieldAlert } from 'lucide-react';
import { authenticatedFetch } from '../../auth';
import { callMcpEndpoint } from '../../api_mcp';

interface BotBridgeSignal {
  generated_at?: string;
  symbol?: string;
  risk_score?: number;
  regime?: string;
  allow_entries?: boolean;
  stake_multiplier?: number;
  spread_multiplier?: number;
  blocked_pairs?: string[];
  reasons?: string[];
  pair_signals?: Record<string, { risk_score: number; regime: string; allow_entry: boolean; stake_multiplier: number }>;
}

export default function BotFleetPanel() {
  const [signal, setSignal] = useState<BotBridgeSignal | null>(null);
  const [ftStatus, setFtStatus] = useState<any>(null);
  const [ftProfit, setFtProfit] = useState<any>(null);
  const [octoStatus, setOctoStatus] = useState<any>(null);
  const [hbStatus, setHbStatus] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAll = useCallback(async () => {
    try {
      const sigPromise = authenticatedFetch('/api/bot-bridge/signal')
        .then((r) => r.json())
        .then((d) => (d.ok && d.available ? d.signal : null))
        .catch(() => null);

      const [sig, ftS, ftP, octoS, hbS] = await Promise.all([
        sigPromise,
        callMcpEndpoint('MCP_FREQTRADE', 'status', {}, 1).catch(() => null),
        callMcpEndpoint('MCP_FREQTRADE', 'profit', {}, 1).catch(() => null),
        callMcpEndpoint('MCP_OCTOBOT', 'status', {}, 1).catch(() => null),
        callMcpEndpoint('MCP_HUMMINGBOT', 'bot_status', {}, 1).catch(() => null),
      ]);

      setSignal(sig);
      setFtStatus(ftS);
      setFtProfit(ftP);
      setOctoStatus(octoS);
      setHbStatus(hbS);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const initTimer = setTimeout(fetchAll, 0);
    const timer = setInterval(fetchAll, 15000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, [fetchAll]);

  const runBotAction = async (mcp: string, method: string, label: string) => {
    setActionMessage(`Executing ${label}...`);
    try {
      await callMcpEndpoint(mcp, method, {}, 1);
      setActionMessage(`${label} succeeded.`);
      fetchAll();
    } catch (err: any) {
      setActionMessage(`${label} failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const regimeColor =
    signal?.regime === 'halt'
      ? '#ef4444'
      : signal?.regime === 'caution'
      ? '#f59e0b'
      : signal?.regime === 'risk_on'
      ? '#10b981'
      : '#38bdf8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', border: `1px solid ${regimeColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color={regimeColor} />
            <h3 style={{ margin: 0, color: '#f8fafc', letterSpacing: '1px' }}>
              BOT BRIDGE MARKET REGIME & RISK OVERLAY
            </h3>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {signal ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>REGIME</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: regimeColor, textTransform: 'uppercase' }}>
                {signal.regime || 'neutral'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>RISK SCORE</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>
                {signal.risk_score ?? '--'} / 100
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>STAKE MULTIPLIER</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                {signal.stake_multiplier ?? 1.0}x
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>ENTRIES ALLOWED</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: signal.allow_entries ? '#10b981' : '#ef4444' }}>
                {signal.allow_entries ? 'YES' : 'BLOCKED'}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', margin: 0 }}>
            No <code>mcp_signals.json</code> found yet. Run <code>python bot_bridge.py --watch</code> to stream live regime signals.
          </p>
        )}

        {signal?.reasons && signal.reasons.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#cbd5e1' }}>
            <strong>Signals:</strong> {signal.reasons.join(' • ')}
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="glass-panel" style={{ padding: '10px 16px', color: '#38bdf8', fontSize: '13px' }}>
          {actionMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Freqtrade Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Bot size={18} color="#10b981" />
            <h4 style={{ margin: 0, color: '#10b981' }}>FREQTRADE (MCP :7011)</h4>
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
            <div>Status: {ftStatus?.status_code === 200 ? 'Connected' : 'Offline / Standby'}</div>
            <div>
              Profit:{' '}
              {ftProfit?.json?.profit_all_coin !== undefined
                ? `${Number(ftProfit.json.profit_all_coin).toFixed(2)}`
                : 'N/A'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_FREQTRADE', 'start_bot', 'Freqtrade Start')}>
              <Play size={13} /> Start
            </button>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_FREQTRADE', 'stopbuy', 'Freqtrade StopBuy')}>
              <Pause size={13} /> StopBuy
            </button>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_FREQTRADE', 'reload_config', 'Freqtrade Reload')}>
              <RefreshCw size={13} /> Reload
            </button>
          </div>
        </div>

        {/* OctoBot Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={18} color="#38bdf8" />
            <h4 style={{ margin: 0, color: '#38bdf8' }}>OCTOBOT (MCP :7012)</h4>
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
            Status: {octoStatus?.status_code === 200 ? 'Connected' : 'Offline / Standby'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_OCTOBOT', 'start_bot', 'OctoBot Start')}>
              <Play size={13} /> Start
            </button>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_OCTOBOT', 'stop_bot', 'OctoBot Stop')}>
              <Pause size={13} /> Stop
            </button>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_OCTOBOT', 'reload_tentacles', 'OctoBot Reload Tentacles')}>
              <RefreshCw size={13} /> Reload Tentacles
            </button>
          </div>
        </div>

        {/* Hummingbot Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Bot size={18} color="#f59e0b" />
            <h4 style={{ margin: 0, color: '#f59e0b' }}>HUMMINGBOT (MCP :7013)</h4>
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
            Backend API: {hbStatus?.status_code === 200 ? 'Connected' : 'Offline / Standby'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_HUMMINGBOT', 'connectors', 'Hummingbot Connectors')}>
              Check Connectors
            </button>
            <button type="button" className="btn-outline" onClick={() => runBotAction('MCP_HUMMINGBOT', 'list_controllers', 'Hummingbot Controllers')}>
              List Controllers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
