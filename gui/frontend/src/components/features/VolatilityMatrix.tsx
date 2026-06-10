import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

const Terrain = React.memo(({ waveHeight }: { waveHeight: number }) => {
  const mesh = useRef<THREE.Mesh>(null);

  // Create a grid geometry
  const geometry = useMemo(() => new THREE.PlaneGeometry(20, 20, 50, 50), []);

  useFrame((state) => {
    if (!mesh.current) return;

    // Animate vertices to create waves
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];

      // Calculate a noise-like sine wave value
      const t = state.clock.elapsedTime * 0.5;
      const wave = Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t) * waveHeight;

      positions[i + 2] = wave; // Modify Z
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <bufferGeometry attach="geometry" {...geometry} />
      <meshStandardMaterial color="#8b5cf6" wireframe={true} emissive="#8b5cf6" emissiveIntensity={0.5} transparent opacity={0.6} />
    </mesh>
  );
});

export default function VolatilityMatrix() {
  const [waveHeight, setWaveHeight] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    let active = true;

    const fetchVolatilityData = async () => {
      try {
        setLoading(true);
        const targetExchange = 'binance';
        const targetSymbol = activeSymbol;

        // Using Bollinger Bands width as proxy for 3D volatility surface height
        const taData = await callMcpEndpoint('MCP_TA', 'compute_indicators', { exchange: targetExchange, symbol: targetSymbol, timeframe: '1h' });

        if (!active) return;

        let newWaveHeight = 1.5;

        if (taData && taData.bb_upper && taData.bb_lower && taData.close) {
            const widthPercent = (taData.bb_upper - taData.bb_lower) / taData.close;
            // 1% spread = normal wave, 5% spread = high wave
            newWaveHeight = Math.max(0.5, Math.min(5.0, widthPercent * 100));
        }

        setWaveHeight(newWaveHeight);
      } catch (err) {
        console.error("Volatility Matrix fetch error", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchVolatilityData();
    let timeoutId: NodeJS.Timeout;

    const fetchVolatilityDataWithPolling = async () => {
      try {
        await fetchVolatilityData();
      } finally {
        if (active) timeoutId = setTimeout(fetchVolatilityDataWithPolling, 60000);
      }
    };
    fetchVolatilityDataWithPolling();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [activeSymbol]);

  return (
    <div className="card interactive-element" style={{ height: '300px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <h3 style={{ margin: 0, color: '#8b5cf6', fontFamily: 'monospace', fontSize: '14px', textShadow: '0 0 5px #8b5cf6' }}>QUANTUM ANOMALY MATRIX</h3>
        <div style={{ fontSize: '10px', color: '#a3a3a3' }}>3D Volatility Surface mapping</div>
      </div>

      <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10, fontSize: '10px', color: '#8b5cf6', fontFamily: 'monospace' }}>
        STATE: {loading ? "SCANNING..." : `WAVE TENSION ${(waveHeight * 10).toFixed(1)}`}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 8, 15], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#8b5cf6" />
          <Terrain waveHeight={waveHeight} />
          <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={0.5} />
        </Canvas>
      </div>
    </div>
  );
}
