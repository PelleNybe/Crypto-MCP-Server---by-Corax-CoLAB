import React, { useRef, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

// Feature 1: The "Neural-Net" Liquidity Flow & Arbitrage Map
export default function NeuralNetLiquidity() {
    const fgRef = useRef<any>();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });

  useEffect(() => {
    let active = true;
    const fetchLiquidity = async () => {
      try {
        let exchanges = ['binance', 'kraken', 'kucoin'];
        let pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

        try {
             const portfolio = await callMcpEndpoint('MCP_PORTFOLIO', 'portfolio_value', { exchanges: ['binance'] });
             if (portfolio && portfolio.portfolio) {
                 const coins = Object.keys(portfolio.portfolio);
                 if (coins.length >= 3) {
                     pairs = [
                         `${coins[0].toUpperCase()}/USDT`,
                         `${coins[1].toUpperCase()}/USDT`,
                         `${coins[2].toUpperCase()}/USDT`
                     ];
                 }
             }
        } catch (e) {}

        let nodes = [];
        let links = [];

        exchanges.forEach(ex => {
            nodes.push({ id: ex, group: 'exchange', size: 20, color: '#facc15' });
        });

        // We will try to fetch real tickers to build the network
        // If an exchange has a pair, link it. If there's an arbitrage opportunity, link the pairs across exchanges.
        for (const pair of pairs) {
            const pairNodeId = `root-${pair}`;
            nodes.push({ id: pairNodeId, group: 'pair-root', size: 10, color: '#10b981' });

            for (let eIdx = 0; eIdx < exchanges.length; eIdx++) {
                const ex = exchanges[eIdx];
                const exPairId = `${ex}-${pair}`;

                try {
                    // Try to get ticker to confirm it exists and maybe use volume for link size
                    const ticker = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: ex, symbol: pair }).catch(() => null);
                    if (ticker && ticker.last) {
                        nodes.push({ id: exPairId, group: 'pair', size: 5, color: '#60a5fa' });
                        links.push({ source: ex, target: exPairId, value: Math.max(1, Math.min((ticker.baseVolume || 100) / 1000, 10)) });
                        links.push({ source: pairNodeId, target: exPairId, value: 1, isPair: true });

                        // Check for arbitrage with previous exchanges
                        for (let i = 0; i < eIdx; i++) {
                             const prevEx = exchanges[i];
                             const prevExPairId = `${prevEx}-${pair}`;
                             const prevTicker = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: prevEx, symbol: pair }).catch(() => null);
                             if (prevTicker && prevTicker.last) {
                                 const spread = Math.abs(ticker.last - prevTicker.last) / ticker.last * 100;
                                 if (spread > 0.1) {
                                     // Arbitrage link
                                     links.push({
                                        source: prevExPairId,
                                        target: exPairId,
                                        value: spread * 10,
                                        isArbitrage: true,
                                        color: '#ef4444' // Neon red laser
                                     });
                                 }
                             }
                        }
                    }
                } catch(e) {}
            }
        }

        if (active) {
            setGraphData({ nodes, links });
        }
      } catch (err) {
        console.error("Neural fetch error", err);
      }
    };

    fetchLiquidity();
    let timeoutId: NodeJS.Timeout;

    const fetchLiquidityWithPolling = async () => {
      try {
        await fetchLiquidity();
      } finally {
        if (active) timeoutId = setTimeout(fetchLiquidityWithPolling, 30000);
      }
    };

    fetchLiquidityWithPolling();
    return () => { active = false; clearTimeout(timeoutId); };
  }, []);

  return (
    <div className="card glass-panel" style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <h3 style={{ position: 'absolute', top: 10, left: 15, zIndex: 10, color: '#10b981', margin: 0, textShadow: '0 0 10px #10b981' }}>
        NEURAL-NET LIQUIDITY & ARBITRAGE
      </h3>
      <div style={{ position: 'absolute', top: 35, left: 15, zIndex: 10, color: '#94a3b8', fontSize: '12px' }}>
        Cross-Exchange 3D Force-Directed Map
      </div>
      <div style={{ width: '100%', height: '100%' }}>
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="id"
          nodeColor={node => (node as any).color}
          nodeRelSize={6}
          linkColor={link => (link as any).isArbitrage ? '#ef4444' : '#334155'}
          linkWidth={link => (link as any).isArbitrage ? 2 : 1}
          linkDirectionalParticles={link => (link as any).isArbitrage ? 4 : 0}
          linkDirectionalParticleSpeed={d => 0.01}
          linkDirectionalParticleWidth={2}
          backgroundColor="#00000000" // transparent
          enableNodeDrag={false}
          showNavInfo={false}
          width={800} // Set a fixed width or use a responsive wrapper
          height={400}
        />
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 15, zIndex: 10, display: 'flex', gap: '10px' }}>
        <span style={{ color: '#10b981', fontSize: '12px' }}>● Exchange Hub</span>
        <span style={{ color: '#60a5fa', fontSize: '12px' }}>● Trading Pair</span>
        <span style={{ color: '#ef4444', fontSize: '12px' }}>⤍ Arbitrage Flow</span>
      </div>
    </div>
  );
}
