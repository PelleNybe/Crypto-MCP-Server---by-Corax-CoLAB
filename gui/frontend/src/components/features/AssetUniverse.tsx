import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const Planet = React.memo(({ asset, amount, value, index, totalValue }: { asset: string, amount: number, value: number, index: number, totalValue: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Calculate size and orbit based on value
  const proportion = totalValue > 0 ? value / totalValue : 0.1;
  const radius = Math.max(0.5, proportion * 5);
  const distance = index === 0 ? 0 : 3 + index * 2;
  const speed = 0.5 / (index + 1);
  const color = new THREE.Color().setHSL((index * 0.15) % 1, 0.8, 0.5);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
    if (orbitRef.current && index > 0) {
      orbitRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group ref={orbitRef}>
      <group position={[distance, 0, 0]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Atmosphere glow */}
        <mesh>
          <sphereGeometry args={[radius * 1.1, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>

        <Html position={[0, radius + 0.5, 0]} center distanceFactor={15}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${color.getStyle()}`,
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 10px ${color.getStyle()}`
          }}>
            <div style={{ fontWeight: 'bold', color: color.getStyle() }}>{asset}</div>
            <div>${value.toFixed(2)}</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>{(proportion * 100).toFixed(1)}%</div>
          </div>
        </Html>
      </group>

      {/* Orbit ring */}
      {index > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[distance - 0.05, distance + 0.05, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
});

export default function AssetUniverse({ portfolio, totalValue }: { portfolio: any[], totalValue: number }) {
  // Sort portfolio by value descending so biggest is in the center
  const sortedPortfolio = useMemo(() => {
    return [...portfolio].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)).filter(a => a.value_usd > 0);
  }, [portfolio]);

  if (sortedPortfolio.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No asset data available</div>;
  }

  return (
    <div style={{ width: '100%', height: '400px', background: '#050505', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 15, 20], fov: 45 }}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <group>
          {sortedPortfolio.map((asset, index) => (
            <Planet
              key={asset.asset}
              asset={asset.asset}
              amount={asset.amount}
              value={asset.value_usd || 0}
              index={index}
              totalValue={totalValue}
            />
          ))}
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={50}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
        DRAG TO ROTATE • SCROLL TO ZOOM
      </div>
    </div>
  );
}
