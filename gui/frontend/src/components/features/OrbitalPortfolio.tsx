import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

// Feature 4: Orbital Portfolio Control Deck
// ⚡ Bolt: Wrapped Planet component in React.memo to prevent expensive Three.js
// sub-tree re-renders when parent state (like totalValue or other selections) changes.
const Planet = React.memo(({ asset, onSelect, selected }: { asset: any, onSelect: any, selected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Starting angle based on distance
  const [angle] = useState((asset.distance % 3) * Math.PI);

  useFrame((state, delta) => {
    if (!selected) {
      if (orbitRef.current) {
         orbitRef.current.rotation.y += asset.speed * delta;
      }
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group ref={orbitRef}>
      {/* Orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[asset.distance - 0.05, asset.distance + 0.05, 64]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* The Planet */}
      <mesh
        ref={meshRef}
        position={[Math.cos(angle) * asset.distance, 0, Math.sin(angle) * asset.distance]}
        onClick={(e) => { e.stopPropagation(); onSelect(asset); }}
        onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
        onPointerOut={(e) => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[asset.size, 32, 32]} />
        <meshStandardMaterial
          color={asset.color}
          emissive={asset.color}
          emissiveIntensity={selected ? 0.8 : 0.2}
          wireframe={selected}
        />
        <Text
          position={[0, asset.size + 0.5, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {asset.name}
        </Text>

        {selected && (
           <Html position={[asset.size + 0.5, 0, 0]}>
              <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: `1px solid ${asset.color}`,
                  padding: '10px',
                  borderRadius: '5px',
                  color: 'white',
                  width: '150px',
                  boxShadow: `0 0 10px ${asset.color}`
              }}>
                 <h4 style={{ margin: 0, color: asset.color }}>{asset.name}</h4>
                 <p style={{ margin: '5px 0', fontSize: '12px' }}>Allocation: {asset.allocation}%</p>
                 <p style={{ margin: '5px 0', fontSize: '12px' }}>Value: ${asset.value}</p>
                 <p style={{ margin: '5px 0', fontSize: '12px' }}>Amount: {asset.amount}</p>
              </div>
           </Html>
        )}
      </mesh>
    </group>
  );
});


const Starfield = () => {
  const meshRef = useRef<THREE.Points>(null);
  const count = 500;

  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = ((Math.sin(Date.now()) * 0.5 + 0.5) - 0.5) * 50;
      temp[i * 3 + 1] = ((Math.sin(Date.now()) * 0.5 + 0.5) - 0.5) * 50;
      temp[i * 3 + 2] = ((Math.sin(Date.now()) * 0.5 + 0.5) - 0.5) * 50;
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#cbd5e1" transparent opacity={0.6} sizeAttenuation={true} />
    </points>
  );
};

export default function OrbitalPortfolio() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  // ⚡ Bolt: Memoize the onSelect event handler to prevent breaking Planet's React.memo
  const handleSelectAsset = React.useCallback((a: any) => {
      setSelectedAsset(a.id);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchPortfolioData = async () => {
      try {
        const data = await callMcpEndpoint('MCP_PORTFOLIO', 'portfolio_value', { exchanges: ['binance'] });
        if (!active || !data || !data.portfolio) return;

        const total = data.total_usd || 0;
        if (total === 0) {
            setAssets([]);
            setTotalValue(0);
            return;
        }

        const colors = ['#f59e0b', '#60a5fa', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#f43f5e'];

        // Ensure distance is uniquely increasing based on sort
        let currentDistance = 4;
        let colorIdx = 0;

        // Map real portfolio data
        const mappedAssets = Object.entries(data.portfolio)
          .map(([coin, amount]: [string, any]) => {
             const price = (data.prices && data.prices[coin]) ? data.prices[coin] : 0;
             const val = amount * price;
             const allocation = total > 0 ? (val / total) * 100 : 0;
             const size = Math.max(0.4, Math.min(2.0, (allocation / 100) * 3));

             return {
                 id: coin.toLowerCase(),
                 name: coin.toUpperCase(),
                 amount: amount,
                 size: size,
                 val: val,
                 allocation: allocation.toFixed(1),
                 value: val.toLocaleString(undefined, { maximumFractionDigits: 2 }),
             };
          })
          .filter(a => parseFloat(a.allocation) > 1.0) // Only show top assets > 1% allocation
          .sort((a, b) => b.val - a.val) // Largest allocation closer to center? Or furthest? Let's do largest = biggest size, distance increments
          .map((coinData) => {
             coinData.distance = currentDistance;
             coinData.speed = 0.1 + (parseFloat(coinData.allocation) * 0.005); // Speed based on allocation
             coinData.color = colors[colorIdx % colors.length];
             currentDistance += 2.5;
             colorIdx++;
             return coinData;
          });

        setAssets(mappedAssets);
        setTotalValue(total);
      } catch (e) {
          console.error("Orbital fetch error", e);
      }
    };

    fetchPortfolioData();
    let timeoutId: NodeJS.Timeout;

    const fetchPortfolioDataWithPolling = async () => {
      try {
        await fetchPortfolioData();
      } finally {
        if (active) timeoutId = setTimeout(fetchPortfolioDataWithPolling, 30000);
      }
    };

    fetchPortfolioDataWithPolling();
    return () => { active = false; clearTimeout(timeoutId); };
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ height: '400px', width: '100%', position: 'relative', padding: 0, overflow: 'hidden', borderLeft: '4px solid #8b5cf6' }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10 }}>
        <h3 style={{ color: '#8b5cf6', margin: 0, textShadow: '0 0 10px #8b5cf6' }}>
          ORBITAL PORTFOLIO
        </h3>
        <span className="small-muted" style={{ display: 'block' }}>3D Control Deck</span>
      </div>

      {selectedAsset && (
        <button
           aria-label="Unlock HUD"
           onClick={() => setSelectedAsset(null)}
           style={{ position: 'absolute', top: 15, right: 15, zIndex: 10, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
        >
           UNLOCK HUD
        </button>
      )}

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 15, 20], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

        {/* Central Star (Total Portfolio) */}
        <mesh onClick={() => setSelectedAsset(null)}>
           <sphereGeometry args={[2, 32, 32]} />
           <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} wireframe />
           <Text
              position={[0, 3, 0]}
              fontSize={0.5}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              TOTAL: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
        </mesh>

        {assets.map((asset) => (
          <Planet
             key={asset.id}
             asset={asset}
             onSelect={handleSelectAsset}
             selected={selectedAsset === asset.id}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!selectedAsset}
          autoRotateSpeed={0.5}
        />

        {/* Subtle background stars dynamically generated by portfolio scale */}
        <points>
           <bufferGeometry>
              <bufferAttribute
                 attach="attributes-position"
                 count={500}
                 array={new Float32Array(1500).map((_, i) => (Math.sin(i * (totalValue || 123.456)) * 100))}
                 itemSize={3}
              />
           </bufferGeometry>
           <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.5} />
        </points>

      </Canvas>
    </div>
  );
}
