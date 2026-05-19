import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldAlert, TrendingDown } from 'lucide-react';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

const Terrain = ({ stressLevel }: { stressLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const size = 30;
  const segments = 30;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size, segments]);

  useFrame((state) => {
    if (meshRef.current) {
      const pos = meshRef.current.geometry.attributes.position;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Base terrain
        let y = Math.sin(x * 0.5 + time * 0.5) * Math.cos(z * 0.5 + time * 0.5) * 1;

        // Apply stress deformation based on real market parameters
        if (stressLevel > 0) {
          const distanceToCenter = Math.sqrt(x*x + z*z);
          const impact = Math.exp(-distanceToCenter * 0.2) * stressLevel * 5;
          y -= impact * Math.sin(time * 5); // Vibrating crater
        }

        pos.setY(i, y);
      }
      meshRef.current.geometry.computeVertexNormals();
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const materialColor = stressLevel > 0.5 ? '#ef4444' : stressLevel > 0.2 ? '#f59e0b' : '#60a5fa'; // Red on high stress, Amber med, Blue normally

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color={materialColor} wireframe emissive={materialColor} emissiveIntensity={stressLevel > 0 ? 0.8 : 0.2} roughness={0.8} />
    </mesh>
  );
};

export default function QuantumRiskMap() {
  const [stress, setStress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { targetSymbol: activeSymbol, targetExchange: activeExchange } = useActivePortfolioSymbol();

  // Poll for actual risk parameters using TA
  useEffect(() => {
    let active = true;

    const fetchRiskParams = async () => {
      try {
        setLoading(true);
        let targetExchange = activeExchange;
        let targetSymbol = activeSymbol;

        const taData = await callMcpEndpoint('MCP_TA', 'compute_indicators', { exchange: targetExchange, symbol: targetSymbol, timeframe: '1h' });

        if (!active) return;

        let currentStress = 0;

        if (taData) {
            // Extreme RSI implies high risk (overbought > 70, oversold < 30)
            if (taData.rsi) {
                if (taData.rsi > 70) currentStress += 0.3 * ((taData.rsi - 70) / 30);
                if (taData.rsi < 30) currentStress += 0.5 * ((30 - taData.rsi) / 30); // Oversold usually feels more stressful
            }

            // High volatility implies higher stress
            if (taData.bb_upper && taData.bb_lower && taData.close) {
                const widthPercent = (taData.bb_upper - taData.bb_lower) / taData.close;
                if (widthPercent > 0.05) { // 5% spread in 1h is volatile
                    currentStress += Math.min(0.5, (widthPercent - 0.05) * 10);
                }
            }

            // Sell signal implies risk
            if (taData.signal === 'sell') {
                currentStress += 0.2;
            }

            // Cap stress at 1.0
            setStress(Math.min(1.0, currentStress));
        }

      } catch (err) {
        console.error("Quantum Risk Map fetch error", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRiskParams();
    let timeoutId: NodeJS.Timeout;

    const fetchRiskParamsWithPolling = async () => {
      try {
        await fetchRiskParams();
      } finally {
        if (active) timeoutId = setTimeout(fetchRiskParamsWithPolling, 60000);
      }
    };

    fetchRiskParamsWithPolling();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [activeSymbol, activeExchange]);



  return (
    <div className="card interactive-element" style={{ height: '350px', position: 'relative', overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={20} className={stress > 0.5 ? 'text-red' : stress > 0.2 ? 'text-amber' : 'text-blue'} />
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Quantum Risk Topography</h3>
      </div>

      <div style={{ position: 'absolute', bottom: 15, left: 15, zIndex: 10, fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>
        <div>SYSTEM STRESS: {(stress * 100).toFixed(1)}%</div>
        <div>STATUS: {loading ? 'SCANNING...' : stress > 0.5 ? 'CRITICAL' : stress > 0.2 ? 'ELEVATED' : 'NOMINAL'}</div>
      </div>



      {stress > 0.8 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: '#ef4444', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px #ef4444', animation: 'blink 0.5s infinite' }}>
          LIQUIDATION CASCADE IMMINENT
        </div>
      )}

      <Canvas camera={{ position: [0, 10, 20], fov: 45 }}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={stress > 0.5 ? 5 : 2} color={stress > 0.5 ? '#ef4444' : '#ffffff'} />

        <Terrain stressLevel={stress} />

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2 - 0.1} autoRotate={stress < 0.2} autoRotateSpeed={0.5} />
      </Canvas>
      <style>{`
        @keyframes blink { 0% { opacity: 1 } 50% { opacity: 0 } 100% { opacity: 1 } }
      `}</style>
    </div>
  );
}
