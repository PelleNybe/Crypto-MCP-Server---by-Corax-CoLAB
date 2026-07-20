import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

const SonarPing = React.memo(({ position, color, size, onComplete }: { position: [number, number, number], color: string, size: number, onComplete: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1.0);

  useFrame((state, delta) => {
    if (scale < size) {
      setScale(prev => prev + delta * 15);
      setOpacity(prev => Math.max(0, prev - delta * 0.8));
    } else {
      onComplete();
    }
    if (meshRef.current) {
        meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1, 0.05, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh scale={[scale * 0.8, scale * 0.8, scale * 0.8]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

export default function DarkPoolSonar() {
  const [pings, setPings] = useState<any[]>([]);
  const { targetSymbol: activeSymbolHook, targetExchange: activeExchange } = useActivePortfolioSymbol();

  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const fetchTrades = async () => {
        try {
            const limit = 50;
            const trades = await callMcpEndpoint('MCP_CCXT', 'fetch_trades', { exchange: activeExchange, symbol: activeSymbolHook, limit });

            if (active && trades && Array.isArray(trades)) {
                // Find "whale" trades relative to the batch
                const amounts = trades.map((t: any) => t.amount * t.price);
                const avgVolume = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);

                const newPings: any[] = [];
                trades.forEach((trade: any, idx: number) => {
                    const volumeUsd = trade.amount * trade.price;
                    if (volumeUsd > avgVolume * 1.5) { // 1.5x average is a "whale" in this context
                        // Randomize position slightly for visual effect on a plane
                        const angle = (Math.sin(Date.now()) * 0.5 + 0.5) * Math.PI * 2;
                        const radius = (Math.sin(Date.now()) * 0.5 + 0.5) * 8;
                        const x = Math.cos(angle) * radius;
                        const z = Math.sin(angle) * radius;
                        const color = trade.side === 'buy' ? '#10b981' : '#ef4444';
                        const size = Math.min(12, Math.max(3, volumeUsd / avgVolume));

                        newPings.push({
                            id: `${trade.id}-${idx}-${Date.now()}`,
                            position: [x, 0, z],
                            color,
                            size,
                            trade
                        });
                    }
                });

                if (newPings.length > 0) {
                    setPings(prev => [...prev, ...newPings].slice(-15)); // Keep last 15
                }
            }
        } catch (err) {
            if (active) {
                console.error("Error fetching trades for Dark Pool Sonar:", err);
            }
        } finally {
            if (active) {
                timeoutId = setTimeout(fetchTrades, 4000);
            }
        }
    };

    fetchTrades();
    return () => { active = false; clearTimeout(timeoutId); };
  }, [activeSymbolHook, activeExchange]);

  const removePing = React.useCallback((id: string) => {
      setPings(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #8b5cf6', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #8b5cf6' }}>
              Dark Pool Sonar
          </h3>
          <div style={{ fontSize: '10px', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #8b5cf6' }}>
              WHALE TRACKER LIVE
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(2,2,5,1) 100%)', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 8, 8], fov: 60 }}>
              <ambientLight intensity={0.5} />

              {/* Sonar Grid */}
              <gridHelper args={[20, 20, '#334155', '#1e293b']} position={[0, -0.1, 0]} />

              {/* Radar Sweep Effect (Simple rotation) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                  <circleGeometry args={[10, 64]} />
                  <meshBasicMaterial color="#8b5cf6" transparent opacity={0.05} />
              </mesh>

              {pings.map((ping) => (
                  <group key={ping.id}>
                    <SonarPing
                        position={ping.position}
                        color={ping.color}
                        size={ping.size}
                        onComplete={() => removePing(ping.id)}
                    />
                    <Html position={[ping.position[0], 0.5, ping.position[2]]} center>
                        <div style={{ color: ping.color, fontSize: '10px', fontFamily: 'monospace', pointerEvents: 'none', background: 'rgba(0,0,0,0.7)', padding: '4px 6px', borderRadius: '4px', border: `1px solid ${ping.color}`, textShadow: `0 0 5px ${ping.color}` }}>
                            {ping.trade.side.toUpperCase()}<br/>
                            ${(ping.trade.amount * ping.trade.price).toLocaleString(undefined, {maximumFractionDigits:0})}
                        </div>
                    </Html>
                  </group>
              ))}

              <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} autoRotate={true} autoRotateSpeed={1.0} />
          </Canvas>

          <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
              SCANNING {activeExchange.toUpperCase()} {activeSymbolHook}
          </div>
      </div>
    </div>
  );
}
