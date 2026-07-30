import React, { useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

const MemoizedForceGraph3D = React.memo(({ data, ...props }: any) => {
  return <ForceGraph3D graphData={data} {...props} />;
});

import { callMcpEndpoint } from '../../api_mcp';

export default function NeuralTradeVisualizer({ active, exchange, symbol }: { active: boolean, exchange: string, symbol: string }) {
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    let mounted = true;

    const fetchRoutingData = async () => {
      if (!active) {
          // Provide a neutral state
          setData({
              nodes: [{ id: 'IDLE', group: 1, val: 5 } as any],
              links: []
          });
          return;
      }

      try {
        // To process smart routing diagnostics, we'll fetch orderbook data from the exchange
        // to show liquidity depth nodes, creating a real representation of execution paths.
        const obData = await callMcpEndpoint('MCP_CCXT', 'fetch_order_book', { exchange: exchange, symbol: symbol, limit: 10 });

        if (!mounted || !obData || !obData.bids || !obData.asks) return;

        const nodes: any[] = [
          { id: 'Source (User)', group: 1, val: 5 },
          { id: `DEX Aggregator (${exchange})`, group: 3, val: 4 }
        ];

        const links: any[] = [
          { source: 'Source (User)', target: `DEX Aggregator (${exchange})` }
        ];

        // Process top 3 bids and asks as liquidity pools
        for (let i = 0; i < Math.min(3, obData.asks.length); i++) {
            const askNodeId = `Ask Pool @ ${obData.asks[i][0]}`;
            nodes.push({ id: askNodeId, group: 2, val: Math.max(1, obData.asks[i][1]) });
            links.push({ source: `DEX Aggregator (${exchange})`, target: askNodeId });
        }

        for (let i = 0; i < Math.min(3, obData.bids.length); i++) {
            const bidNodeId = `Bid Pool @ ${obData.bids[i][0]}`;
            nodes.push({ id: bidNodeId, group: 4, val: Math.max(1, obData.bids[i][1]) });
            links.push({ source: `DEX Aggregator (${exchange})`, target: bidNodeId });
        }

        setData({ nodes, links });

      } catch (err) {
        console.error("NeuralTradeVisualizer fetch error", err);
      }
    };

    fetchRoutingData();

    return () => {
        mounted = false;
    };
  }, [active, exchange, symbol]);

  return (
    <div style={{ height: '150px', background: '#020205', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: `1px solid ${active ? '#3b82f6' : '#334155'}` }}>
        <div style={{ position: 'absolute', top: 5, left: 5, fontSize: '10px', color: active ? '#3b82f6' : '#888', zIndex: 10, fontFamily: 'monospace' }}>
            {active ? `EXECUTING NEURAL ROUTING (${symbol})...` : 'ROUTING MAP IDLE'}
        </div>
        <MemoizedForceGraph3D
            graphData={data}
            nodeLabel="id"
            nodeAutoColorBy="group"
            linkColor={() => active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}
            linkWidth={active ? 2 : 1}
            linkDirectionalParticles={active ? 4 : 0}
            linkDirectionalParticleSpeed={0.01}
            linkDirectionalParticleColor={() => '#3b82f6'}
            backgroundColor="#020205"
            showNavInfo={false}
            width={300}
            height={150}
        />
        {/* Scanning line effect when active */}
        {active && (
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2), transparent)',
                animation: 'scan 2s linear infinite',
                pointerEvents: 'none'
            }} />
        )}
        <style>{`
            @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
        `}</style>
    </div>
  );
}
