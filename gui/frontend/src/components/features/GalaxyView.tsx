import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

// ⚡ Bolt: Wrapped Star component in React.memo to prevent 48 out of 50 Three.js
// instances from recalculating layout and re-rendering when a single star is selected.
const Star = React.memo(({ coin, onSelect, selected }: { coin: any, onSelect: any, selected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Speed based on volume, distance based on rank
  const distance = Math.max(2, coin.market_cap_rank * 0.5);
  const speed = Math.max(0.01, (coin.total_volume / coin.market_cap) * 2);
  const size = Math.max(0.1, Math.min(1.5, Math.log10(coin.market_cap) / 5 - 1));

  const isPositive = coin.price_change_percentage_24h > 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  const [angle] = useState(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (orbitRef.current) {
        orbitRef.current.rotation.y += speed * delta * (isPositive ? 1 : -1);
    }
  });

  return (
    <group ref={orbitRef}>
        <mesh position={[Math.cos(angle) * distance, (Math.random()-0.5)*2, Math.sin(angle) * distance]} onClick={(e) => { e.stopPropagation(); onSelect(coin); }}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1 : 0.4} />

            {selected && (
                <Html position={[size + 0.2, 0, 0]}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: `1px solid ${color}`, padding: '10px', borderRadius: '5px', color: 'white', width: '150px', pointerEvents: 'none' }}>
                        <h4 style={{ margin: 0, color }}>{coin.symbol.toUpperCase()}</h4>
                        <p style={{ margin: '5px 0', fontSize: '12px' }}>Rank: #{coin.market_cap_rank}</p>
                        <p style={{ margin: '5px 0', fontSize: '12px' }}>Price: ${coin.current_price}</p>
                        <p style={{ margin: '5px 0', fontSize: '12px' }}>24h: {coin.price_change_percentage_24h?.toFixed(2)}%</p>
                    </div>
                </Html>
            )}
        </mesh>
    </group>
  );
});

export default function GalaxyView() {
  const [coins, setCoins] = useState<any[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  const handleSelect = useCallback((coin: any) => {
    setSelectedCoin(coin);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchCoins = async () => {
        try {
            const data = await callMcpEndpoint('MCP_COINGECKO', 'get_coins_markets', { vs_currency: 'usd', limit: 50 });
            if (active && data && Array.isArray(data)) {
                setCoins(data);
            }
        } catch (err) {
            console.error("Error fetching coins for Galaxy View:", err);
        }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); // 1 min update
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #f59e0b', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #f59e0b' }}>
              Galaxy View
          </h3>
          <div style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
              MARKET CAP GRAVITY WELL
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 15, 30], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

              {/* Central Black Hole (Bitcoin) - Wait, we map all coins so BTC will naturally be big */}
              {coins.map(coin => (
                  <Star key={coin.id} coin={coin} onSelect={handleSelect} selected={selectedCoin?.id === coin.id} />
              ))}

              <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} autoRotate={true} autoRotateSpeed={0.2} />
          </Canvas>
          <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
              TOP 50 COINS BY MARKET CAP
          </div>
      </div>
    </div>
  );
}
