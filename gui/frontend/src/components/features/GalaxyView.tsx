import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

// ⚡ Bolt: Wrapped Star component in React.memo to prevent 48 out of 50 Three.js
// instances from recalculating layout and re-rendering when a single star is selected.
const CryptoStar = React.memo(({ coin, onSelect, selected }: { coin: any, onSelect: any, selected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Speed based on volume, distance based on rank
  const distance = Math.max(2, coin.market_cap_rank * 0.4);
  const speed = Math.max(0.05, (coin.total_volume / coin.market_cap) * 5);
  const size = Math.max(0.1, Math.min(1.0, Math.log10(coin.market_cap) / 5 - 1));

  const isPositive = coin.price_change_percentage_24h > 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  const [angle] = useState((Math.sin(Date.now()) * 0.5 + 0.5) * Math.PI * 2);
  const [yOffset] = useState(((Math.sin(Date.now()) * 0.5 + 0.5)-0.5)*3);

  useFrame((state, delta) => {
    if (orbitRef.current) {
        orbitRef.current.rotation.y += speed * delta * (isPositive ? 1 : -1);
    }
    if (glowRef.current) {
        glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + angle) * 0.1);
        glowRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={orbitRef}>
        <group position={[Math.cos(angle) * distance, yOffset, Math.sin(angle) * distance]}>
            {/* Core */}
            <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(coin); }}>
                <sphereGeometry args={[size, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 2 : 0.8} />
            </mesh>

            {/* Glow/Halo */}
            <mesh ref={glowRef} scale={[size*1.5, size*1.5, size*1.5]} renderOrder={-1}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Orbit Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[-Math.cos(angle)*distance, -yOffset, -Math.sin(angle)*distance]}>
                <ringGeometry args={[distance - 0.02, distance + 0.02, 64]} />
                <meshBasicMaterial color="#334155" transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>

            {selected && (
                <Html position={[size + 0.5, 0, 0]} center>
                    <div className="card glass-panel" style={{ padding: '10px', width: '160px', borderLeft: `3px solid ${color}`, pointerEvents: 'none' }}>
                        <h4 style={{ margin: 0, color, textShadow: `0 0 5px ${color}` }}>{coin.symbol.toUpperCase()}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '5px' }}>
                            <span style={{ color: '#94a3b8' }}>Rank</span>
                            <span style={{ color: '#fff' }}>#{coin.market_cap_rank}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span style={{ color: '#94a3b8' }}>Price</span>
                            <span style={{ color: '#fff' }}>${coin.current_price.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span style={{ color: '#94a3b8' }}>24h</span>
                            <span style={{ color }}>{coin.price_change_percentage_24h.toFixed(2)}%</span>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    </group>
  );
});

export default function GalaxyView() {
  const [coins, setCoins] = useState<any[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const fetchCoins = async () => {
        try {
            const data = await callMcpEndpoint('MCP_COINGECKO', 'get_coins_markets', { vs_currency: 'usd', order: 'market_cap_desc', per_page: 50 });
            if (active && data && Array.isArray(data)) {
                setCoins(data);
            }
        } catch (err) {
            console.error("Error fetching coins for Galaxy View:", err);
        }
    };

    fetchCoins();
    let timeoutId: NodeJS.Timeout;

    const fetchCoinsWithPolling = async () => {
      try {
        await fetchCoins();
      } finally {
        if (active) timeoutId = setTimeout(fetchCoinsWithPolling, 60000);
      }
    };

    fetchCoinsWithPolling();
    return () => { active = false; clearTimeout(timeoutId); };
  }, []);

  // ⚡ Bolt: Wrapped onSelect in useCallback to prevent child React.memo invalidation.
  const handleSelect = useCallback((coin: any) => {
      setSelectedCoin(coin);
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #f59e0b', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #f59e0b' }}>
              Gravity Well (Top 50)
          </h3>
          <div style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
              MARKET CAP & VOLUME
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(2,2,5,1) 100%)', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 15, 20], fov: 60 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[0, 0, 0]} intensity={2} color="#f59e0b" distance={50} />

              <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

              {/* Supermassive Black Hole (Center) */}
              <mesh position={[0,0,0]}>
                  <sphereGeometry args={[1, 32, 32]} />
                  <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh position={[0,0,0]}>
                  <sphereGeometry args={[1.2, 32, 32]} />
                  <meshBasicMaterial color="#f59e0b" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
              </mesh>

              {coins.map((coin) => (
                  <CryptoStar
                      key={coin.id}
                      coin={coin}
                      onSelect={handleSelect}
                      selected={selectedCoin?.id === coin.id}
                  />
              ))}

              <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} autoRotate={!selectedCoin} autoRotateSpeed={0.5} />
          </Canvas>

          {/* Overlay info */}
          <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
              SIZE = CAP | SPEED = VOL | COLOR = 24H
          </div>
      </div>
    </div>
  );
}
