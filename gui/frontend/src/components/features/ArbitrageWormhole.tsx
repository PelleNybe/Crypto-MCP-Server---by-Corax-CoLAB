import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';
import { Network } from 'lucide-react';

const WormholeTunnel = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float r = length(uv);
      float theta = atan(uv.y, uv.x);

      // Cyberpunk glowing green/cyan colors
      vec3 color1 = vec3(0.06, 0.72, 0.50); // #10b981
      vec3 color2 = vec3(0.0, 0.8, 1.0);    // Cyan

      float spiral = sin(theta * 10.0 + r * 20.0 - time * 5.0);
      float glow = exp(-r * 3.0);

      vec3 finalColor = mix(color1, color2, sin(time + theta) * 0.5 + 0.5);
      float alpha = smoothstep(0.0, 0.5, glow * (spiral + 1.0));

      gl_FragColor = vec4(finalColor * alpha * 2.0, alpha * 0.8);
    }
  `;

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <cylinderGeometry args={[2, 0.5, 20, 32, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ time: { value: 0 } }}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

const ExchangeHub = ({ position, name, price, isTarget }: { position: [number, number, number], name: string, price: number, isTarget?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * (isTarget ? 1 : 0.5);
    }
  });

  const color = isTarget ? "#10b981" : "#6366f1"; // Green for target, Indigo for source

  return (
    <group position={position} ref={ref}>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid ${color}`,
          padding: '4px 8px',
          borderRadius: '4px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 10px ${color}`,
          textTransform: 'uppercase'
        }}>
          <div>{name}</div>
          <div style={{ color }}>${price.toFixed(2)}</div>
        </div>
      </Html>
    </group>
  );
};

const ArbitrageParticle = ({ start, end, speed }: { start: THREE.Vector3, end: THREE.Vector3, speed: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    setProgress((p) => {
      let next = p + delta * speed;
      if (next > 1) next = 0;
      return next;
    });

    if (meshRef.current) {
      meshRef.current.position.lerpVectors(start, end, progress);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#10b981" />
      <pointLight color="#10b981" intensity={0.5} distance={2} />
    </mesh>
  );
};

export default function ArbitrageWormhole() {
  const [opportunities, setOpportunities] = useState<any[]>([]);


  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    let active = true;
    const fetchArbitrage = async () => {
      try {
        let pair = activeSymbol;

        // Fetch tickers from different exchanges to compare spread
        const t1 = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: 'kraken', symbol: pair });
        const t2 = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: 'binance', symbol: pair });

        if (!active) return;

        if (t1 && t2 && t1.last && t2.last) {
          const spread = Math.abs(t1.last - t2.last);
          if (spread > 10) {
            setOpportunities([{
              pair: pair,
              source: t1.last < t2.last ? 'Kraken' : 'Binance',
              target: t1.last < t2.last ? 'Binance' : 'Kraken',
              spread: spread.toFixed(2),
              p1: t1.last < t2.last ? t1.last : t2.last,
              p2: t1.last < t2.last ? t2.last : t1.last
            }]);
          } else {
            setOpportunities([]);
          }
        }
      } catch (err) {
        console.error("Arbitrage fetch error", err);
      }
    };
    fetchArbitrage();
    const interval = setInterval(fetchArbitrage, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [activeSymbol]);


  const sourcePos = new THREE.Vector3(-4, 0, 0);
  const targetPos = new THREE.Vector3(4, 0, 0);

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', height: '350px', position: 'relative', overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Network size={20} className="text-cyan" />
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Cross-DEX Arbitrage Vortex</h3>
      </div>

      {opportunities.length > 0 && (
        <div style={{
          position: 'absolute', top: 15, right: 15, zIndex: 10,
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981',
          padding: '8px 12px', borderRadius: '4px', color: '#10b981', fontFamily: 'monospace',
          animation: 'pulseBg 2s infinite'
        }}>
          DETECTED: {opportunities[0].pair} | SPREAD: +${opportunities[0].spread}
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.2} />

        <ExchangeHub position={[-4, 0, 0]} name={opportunities[0]?.source || 'Scanning...'} price={opportunities[0]?.p1 || 0} />
        <ExchangeHub position={[4, 0, 0]} name={opportunities[0]?.target || 'Scanning...'} price={opportunities[0]?.p2 || 0} isTarget />

        {opportunities.length > 0 && (
          <>
            <WormholeTunnel />
            {Array.from({ length: 20 }).map((_, i) => (
              <ArbitrageParticle key={i} start={sourcePos} end={targetPos} speed={0.5 + (i % 3) * 0.5} />
            ))}
          </>
        )}

        {/* Scanning grid */}
        <gridHelper args={[20, 20, '#334155', '#1e293b']} position={[0, -2, 0]} />

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} minDistance={5} maxDistance={20} />
      </Canvas>
      <style>{`
        @keyframes pulseBg {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
