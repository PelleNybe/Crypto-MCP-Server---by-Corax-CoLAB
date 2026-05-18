import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Anchor } from 'lucide-react';
import { callMcpEndpoint } from '../../api_mcp';

const Constellation = ({ nodes, links }: { nodes: any[], links: any[] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes (Tokens/Wallets) */}
      {nodes.map(n => (
        <mesh key={n.id} position={n.pos}>
          <sphereGeometry args={[n.size, 16, 16]} />
          <meshBasicMaterial color={n.type === 'market' ? '#f59e0b' : '#c084fc'} transparent opacity={0.8} />

          <Html position={[0, n.size + 0.2, 0]} center>
            <div style={{
              color: n.type === 'market' ? '#f59e0b' : '#c084fc',
              fontSize: '10px', fontFamily: 'monospace', textShadow: '0 0 5px #000',
              whiteSpace: 'nowrap'
            }}>
              {n.name}
            </div>
          </Html>
        </mesh>
      ))}

      {/* Links (Relationships) */}
      {links.map((l, i) => {
        const startNode = nodes.find(n => n.id === l.source);
        const endNode = nodes.find(n => n.id === l.target);
        if (!startNode || !endNode) return null;

        const points = [startNode.pos, endNode.pos];

        return (
          <Line
            key={i}
            points={points}
            color="#3b82f6"
            lineWidth={l.value}
            transparent
            opacity={0.4}
            dashed
            dashScale={50}
            dashSize={2}
            dashOffset={0}
          />
        );
      })}
    </group>
  );
};

export default function WhaleConstellations() {
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    let active = true;

    const fetchConstellations = async () => {
      try {
        // Fetch trending data to build constellations
        const trendingData = await callMcpEndpoint('MCP_COINGECKO', 'trending', {});

        if (!active) return;

        if (trendingData && trendingData.coins) {
          const newNodes = [];
          const newLinks = [];

          // Central Node
          const centralPos = new THREE.Vector3(0, 0, 0);
          newNodes.push({
            id: 'market_center',
            name: 'Global Market Nexus',
            type: 'market',
            size: 2,
            pos: centralPos
          });

          // Create nodes for top trending coins
          const topCoins = trendingData.coins.slice(0, 10);

          topCoins.forEach((coinWrapper: any, index: number) => {
            const coin = coinWrapper.item;

            // Distribute in a sphere around the center
            const phi = Math.acos(-1 + (2 * index) / topCoins.length);
            const theta = Math.sqrt(topCoins.length * Math.PI) * phi;

            // Deterministic radius between 6 and 8 based on index
            const r = 6 + (index % 5) * 0.5; // Radius between 6 and 8
            const x = r * Math.cos(theta) * Math.sin(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(phi);

            const nodePos = new THREE.Vector3(x, y, z);

            // Size based on market cap rank if available, else default
            const rank = coin.market_cap_rank || 100;
            const nodeSize = Math.max(0.5, 2 - (rank / 100));

            newNodes.push({
              id: coin.id,
              name: coin.symbol.toUpperCase(),
              type: 'token',
              size: nodeSize,
              pos: nodePos
            });

            // Link to center
            newLinks.push({
              source: coin.id,
              target: 'market_center',
              value: Math.max(0.5, 3 - (index * 0.2)) // Thicker lines for top trending
            });

            // Link to previous node to create a constellation path
            if (index > 0) {
              newLinks.push({
                source: coin.id,
                target: topCoins[index - 1].item.id,
                value: 0.5
              });
            }
          });

          setData({ nodes: newNodes, links: newLinks });
        }
      } catch (err) {
        console.error("Constellation fetch error", err);
      }
    };

    fetchConstellations();
    let timeoutId: NodeJS.Timeout;

    const fetchConstellationsWithPolling = async () => {
      try {
        await fetchConstellations();
      } finally {
        if (active) timeoutId = setTimeout(fetchConstellationsWithPolling, 120000);
      }
    };

    fetchConstellationsWithPolling();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', height: '350px', position: 'relative', overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Anchor size={20} className="text-purple" />
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Trending Constellations</h3>
      </div>

      <div style={{ position: 'absolute', bottom: 15, left: 15, zIndex: 10, color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:8, height:8, background:'#f59e0b', borderRadius:'50%'}}></div> MARKET NEXUS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 4 }}><div style={{width:8, height:8, background:'#c084fc', borderRadius:'50%'}}></div> TRENDING NODES</div>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <color attach="background" args={['#020205']} />

        {/* Deep space background */}
        <mesh position={[0, 0, -20]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#000" />
        </mesh>

        {data.nodes.length > 0 && <Constellation nodes={data.nodes} links={data.links} />}

        <OrbitControls autoRotate autoRotateSpeed={0.5} minDistance={5} maxDistance={30} />
      </Canvas>
    </div>
  );
}
