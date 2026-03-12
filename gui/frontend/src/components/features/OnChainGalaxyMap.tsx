import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

export default function OnChainGalaxyMap() {
  const fgRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Generate mock on-chain galaxy data
    const nodes = [];
    const links = [];
    const NUM_NODES = 150;

    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        id: i,
        val: Math.random() * 5 + 1,
        color: i % 10 === 0 ? '#ff00ff' : '#00ffff' // Whales vs normal
      });
    }

    for (let i = 0; i < NUM_NODES; i++) {
      for (let j = 0; j < 2; j++) {
        const target = Math.floor(Math.random() * NUM_NODES);
        if (target !== i) {
          links.push({
            source: i,
            target: target,
            val: Math.random() * 2
          });
        }
      }
    }

    setData({ nodes, links });
  }, []);

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, paddingBottom: '10px' }}>
        <span style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>🌌 On-Chain Galaxy Map</span>
      </h3>
      <p className="small-muted" style={{ marginBottom: '10px' }}>Real-time topology & whale tracking (Mocked)</p>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          nodeLabel="id"
          nodeRelSize={4}
          nodeResolution={16}
          nodeColor="color"
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={d => d.val * 0.005}
          linkDirectionalParticleWidth={1.5}
          linkColor={() => 'rgba(0, 255, 255, 0.15)'}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
        />
      </div>
    </div>
  );
}
