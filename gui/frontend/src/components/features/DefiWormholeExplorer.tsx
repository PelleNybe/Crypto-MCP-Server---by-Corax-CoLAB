import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Wormhole({ position, color, size, speed, name, apy }) {
  const groupRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += speed;
    }
    if (ringRef.current) {
        ringRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Black hole center */}
      <mesh>
        <sphereGeometry args={[size * 0.4, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Event Horizon Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size, 0.1, 16, 100]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>

      {/* Accretion Disk Particles */}
      <points>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={new Float32Array(500 * 3).fill(0).map((_, i) => {
                if(i%3 === 0) return (Math.random() - 0.5) * size * 2.5; // x
                if(i%3 === 1) return (Math.random() - 0.5) * 0.2; // y
                return (Math.random() - 0.5) * size * 2.5; // z
            })} count={500} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color={color} transparent opacity={0.5} sizeAttenuation />
      </points>

      {/* Label (Html could be used from drei, but keeping it simple with lines for now) */}
      <group position={[size + 0.5, size + 0.5, 0]}>
        <line>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={new Float32Array([0,0,0, -0.5,-0.5,0])} count={2} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={0.5} />
        </line>
      </group>
    </group>
  );
}

export default function DefiWormholeExplorer() {
  const pools = useMemo(() => [
    { name: 'ETH/USDT', apy: '12%', size: 2.5, color: '#00ffff', speed: 0.02, position: [-5, 0, -5] },
    { name: 'BTC/USDT', apy: '8%', size: 3, color: '#ff00ff', speed: 0.015, position: [0, 0, 0] },
    { name: 'SOL/USDC', apy: '25%', size: 1.5, color: '#00ffaa', speed: 0.03, position: [5, 2, -2] },
    { name: 'ARB/ETH', apy: '45%', size: 1, color: '#ff00aa', speed: 0.05, position: [2, -3, 3] },
  ], []);

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
      <h3 style={{ margin: 0, paddingBottom: '10px' }}>
        <span style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>🕳️ DeFi Liquidity "Wormhole" Explorer</span>
      </h3>
      <p className="small-muted" style={{ marginBottom: '10px' }}>Cross-chain TVL & APY visualization</p>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)', background: '#000' }}>
        <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          {pools.map((pool, i) => (
            <Wormhole key={i} {...pool} />
          ))}

          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>

        {/* UI Overlay */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {pools.map((p, i) => (
                <div key={i} style={{ padding: '5px 10px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${p.color}`, borderRadius: '4px', display: 'flex', justifyContent: 'space-between', width: '150px' }}>
                    <span style={{color: '#fff', fontSize: '12px'}}>{p.name}</span>
                    <span style={{color: p.color, fontSize: '12px', fontWeight: 'bold'}}>{p.apy}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
