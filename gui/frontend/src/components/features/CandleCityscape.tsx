import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Line } from '@react-three/drei';
import * as THREE from 'three';

function CandleBuilding({ index, open, close, high, low, volume }) {
  const isBullish = close > open;
  const color = isBullish ? '#00ffff' : '#ff00ff';
  const emissive = isBullish ? '#00aaaa' : '#aa00aa';

  // Position based on time (index)
  const x = index * 1.5 - 20;

  // Body dimensions
  const height = Math.abs(close - open);
  const bodyCenterY = Math.min(open, close) + height / 2;

  return (
    <group position={[x, 0, 0]}>
      {/* Wick */}
      <Line
        points={[[0, low, 0], [0, high, 0]]}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {/* Body / Building */}
      <Box args={[1, height, 1]} position={[0, bodyCenterY, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.8}
          wireframe={Math.random() > 0.8} // Random wireframe glitch effect
        />
      </Box>

      {/* Volume Indicator (Hovering car/drone) */}
      <mesh position={[0, volume / 10 + Math.random(), (Math.random() - 0.5) * 5]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function MovingAverageTrail({ data }) {
    const points = useMemo(() => {
        return data.map((d, i) => new THREE.Vector3(i * 1.5 - 20, (d.open + d.close)/2 + Math.sin(i)*2, 1));
    }, [data]);

    return (
        <Line
            points={points}
            color="#ffff00"
            lineWidth={3}
            dashed
            dashSize={0.5}
            gapSize={0.2}
        />
    )
}

export default function CandleCityscape() {
  const dataLength = 30;

  // Generate mock OHLCV data
  const data = useMemo(() => {
      let currentPrice = 50;
      return Array.from({ length: dataLength }).map((_, i) => {
        const volatility = Math.random() * 5;
        const open = currentPrice;
        const close = open + (Math.random() - 0.5) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        currentPrice = close;
        return { open, close, high, low, volume: Math.random() * 100 };
      });
  }, []);

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
      <h3 style={{ margin: 0, paddingBottom: '10px' }}>
        <span style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>🏙️ Neural-Net Candlestick Cityscape</span>
      </h3>
      <p className="small-muted" style={{ marginBottom: '10px' }}>3D Market visualization layer</p>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(15,23,42,0.5) 100%)' }}>
        <Canvas camera={{ position: [0, 40, 40], fov: 60 }}>
          <fog attach="fog" args={['#020205', 20, 80]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 50, 20]} color="#ffffff" intensity={1} />

          <group position={[0, -20, 0]}>
             {/* Grid Floor */}
            <gridHelper args={[200, 100, '#004444', '#001111']} position={[0, 0, 0]} />

            {data.map((d, i) => (
              <CandleBuilding key={i} index={i} {...d} />
            ))}

            <MovingAverageTrail data={data} />
          </group>

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 - 0.1}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
    </div>
  );
}
