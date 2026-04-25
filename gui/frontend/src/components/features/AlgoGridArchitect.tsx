import React, { useState, useEffect } from 'react';
import { Network, Activity, Settings, Cpu, Save, Plus } from 'lucide-react';
import { authenticatedFetch } from '../../auth';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

const Node = ({ type, title, position, active }: { type: 'source' | 'logic' | 'action', title: string, position: {x: number, y: number}, active: boolean }) => {
  const colors = {
    source: '#3b82f6', // blue
    logic: '#f59e0b', // amber
    action: '#10b981' // green
  };
  const Icon = type === 'source' ? Activity : type === 'logic' ? Cpu : Network;

  return (
    <div style={{
      position: 'absolute',
      left: position.x,
      top: position.y,
      background: 'rgba(0,0,0,0.8)',
      border: `1px solid ${active ? colors[type] : '#334155'}`,
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      boxShadow: active ? `0 0 15px ${colors[type]}40` : 'none',
      transition: 'all 0.3s',
      cursor: 'move',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
        <Icon size={16} color={colors[type]} />
        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>IN: {type !== 'source' ? '●' : ' '}</span>
        <span>OUT: {type !== 'action' ? '●' : ' '}</span>
      </div>
    </div>
  );
};

const Connection = ({ start, end, active }: { start: {x: number, y: number}, end: {x: number, y: number}, active: boolean }) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const path = `M ${start.x} ${start.y} C ${start.x + dx/2} ${start.y}, ${start.x + dx/2} ${end.y}, ${end.x} ${end.y}`;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <path
        d={path}
        fill="none"
        stroke={active ? '#10b981' : '#334155'}
        strokeWidth={active ? 2 : 1}
        className={active ? 'pulse-path' : ''}
      />
      <style>{`
        .pulse-path {
          stroke-dasharray: 10;
          animation: dash 1s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </svg>
  );
};

export default function AlgoGridArchitect() {
  const [activePath, setActivePath] = useState(false);
  const [nodes, setNodes] = useState<{id: number, type: 'source'|'logic'|'action', title: string, pos: {x: number, y: number}}[]>([]);
  const [connections, setConnections] = useState<{start: {x: number, y: number}, end: {x: number, y: number}}[]>([]);
  const [loading, setLoading] = useState(false);
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    // Load strategies from backend or build dynamic default
    const loadStrategies = async () => {
      try {
        const res = await authenticatedFetch('/api/strategies');
        const data = await res.json();
        if (data.ok && data.data && data.data.length > 0) {
            // Load the most recent strategy
            const latest = data.data[0];
            const loadedNodes = JSON.parse(latest.nodes);
            const loadedConnections = JSON.parse(latest.connections);
            if(loadedNodes && loadedNodes.length > 0) {
               setNodes(loadedNodes);
               setConnections(loadedConnections);
               return;
            }
        }

        let pair = activeSymbol;

        setNodes([
          { id: 1, type: 'source', title: 'Market Data Feed', pos: { x: 50, y: 150 } },
          { id: 2, type: 'logic', title: 'RSI > 70', pos: { x: 300, y: 100 } },
          { id: 3, type: 'logic', title: 'MACD Crossover', pos: { x: 300, y: 200 } },
          { id: 4, type: 'action', title: 'Execute Sell', pos: { x: 550, y: 150 } }
        ]);
        setConnections([
          { start: { x: 230, y: 180 }, end: { x: 300, y: 130 } },
          { start: { x: 230, y: 180 }, end: { x: 300, y: 230 } },
          { start: { x: 480, y: 130 }, end: { x: 550, y: 180 } },
          { start: { x: 480, y: 230 }, end: { x: 550, y: 180 } }
        ]);

      } catch (err) {
        console.error("Failed to load strategies:", err);
      }
    };
    loadStrategies();
  }, [activeSymbol]);

  // Trigger the animation on real order execution events via socket
  useEffect(() => {
    if (!(window as any).socket) return;
    const socket = (window as any).socket;

    const handleOrder = () => {
      setActivePath(true);
      setTimeout(() => setActivePath(false), 1500);
    };

    socket.on('order_placed', handleOrder);
    socket.on('order_pending', handleOrder);

    return () => {
      socket.off('order_placed', handleOrder);
      socket.off('order_pending', handleOrder);
    };
  }, []);

  const addNode = () => {
     const newNode = {
         id: Date.now(),
         type: 'logic' as const,
         title: 'New Custom Logic',
         pos: { x: 250 + (nodes.length * 10) % 100, y: 50 + (nodes.length * 30) % 200 }
     };
     setNodes([...nodes, newNode]);
  };

  const saveStrategy = async () => {
      setLoading(true);
      try {
          const res = await authenticatedFetch('/api/strategies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: 'Strategy ' + new Date().toISOString().split('T')[0],
                  nodes: nodes,
                  connections: connections,
                  active: true
              })
          });
          const data = await res.json();
          if (data.ok) {
              console.log("Saved strategy", data.id);
          }
      } catch (err) {
          console.error("Save failed", err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', height: '350px', position: 'relative', overflow: 'hidden', backgroundColor: '#020205' }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 20, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={20} className="text-amber" />
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Strategy Grid Architect</h3>
      </div>

      <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 20, display: 'flex', gap: '10px' }}>
        <button onClick={addNode} className="btn-outline" style={{ fontSize: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={12} /> ADD NODE
        </button>
        <button onClick={saveStrategy} disabled={loading} className="btn-outline" style={{ fontSize: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#10b981', color: '#10b981' }}>
            <Save size={12} /> {loading ? 'SAVING...' : 'SAVE & DEPLOY'}
        </button>
      </div>

      {/* Grid Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.2
      }} />

      {/* Connections */}
      {connections.map((c, i) => (
         <Connection key={i} start={c.start} end={c.end} active={activePath} />
      ))}

      {/* Nodes */}
      {nodes.map(n => (
        <Node key={n.id} type={n.type} title={n.title} position={n.pos} active={activePath} />
      ))}
    </div>
  );
}
