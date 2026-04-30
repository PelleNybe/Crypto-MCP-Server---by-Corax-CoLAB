import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

const ReactorParticle = React.memo(({ position, color, speed }: { position: [number, number, number], color: string, speed: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [angle] = useState(Math.random() * Math.PI * 2);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime * speed + angle) * 0.05;
            meshRef.current.rotation.x += delta * speed;
            meshRef.current.rotation.y += delta * speed;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
        </mesh>
    );
});

const ReactorCore = React.memo(({ gasPriceGwei }: { gasPriceGwei: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    // Base speed and color on gas price
    // < 20 gwei = cool blue/green (slow)
    // 20-50 = yellow (medium)
    // > 50 = red (fast)

    let color = '#3b82f6';
    let speed = 1;
    let intensity = 1;

    if (gasPriceGwei > 50) {
        color = '#ef4444';
        speed = 5;
        intensity = 3;
    } else if (gasPriceGwei > 20) {
        color = '#facc15';
        speed = 2;
        intensity = 2;
    } else if (gasPriceGwei > 0) {
        color = '#10b981';
    }

    // Generate some particles around the core
    const particles = Array.from({ length: 15 }).map((_, i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 3 + Math.random() * 1.5;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        return <ReactorParticle key={i} position={[x, y, z]} color={color} speed={speed} />;
    });

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * speed * 0.5;
            meshRef.current.rotation.y += delta * speed;

            // Pulsate size of the core
            const scale = 1 + Math.sin(state.clock.elapsedTime * speed * 2) * 0.15;
            meshRef.current.scale.set(scale, scale, scale);
        }
        if (outerRingRef.current) {
            outerRingRef.current.rotation.z -= delta * speed * 0.8;
            outerRingRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.5;
        }
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = intensity + Math.sin(state.clock.elapsedTime * speed * 4) * 0.8;
        }
    });

    return (
        <group>
            {/* Energy Field (Outer Torus) */}
            <mesh ref={outerRingRef} renderOrder={0}>
                <torusGeometry args={[3.5, 0.05, 16, 100]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>

            {/* Reactor Core (Inner Torus Knot) */}
            <mesh ref={meshRef} renderOrder={1}>
                <torusKnotGeometry args={[1.8, 0.4, 128, 32]} />
                <meshStandardMaterial ref={materialRef} color={color} emissive={color} emissiveIntensity={intensity} wireframe={true} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Glowing Center Sphere */}
            <mesh renderOrder={-1}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Particles */}
            {particles}

            {/* Text Overlay */}
            <Text position={[0, 0, 2]} fontSize={1.2} color="#ffffff" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/orbitron/v25/yq5yMKwQR1Nfp8snFwdA.woff" outlineWidth={0.05} outlineColor={color}>
                {gasPriceGwei.toFixed(0)}
            </Text>
            <Text position={[0, -0.8, 2]} fontSize={0.4} color="#cbd5e1" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/orbitron/v25/yq5yMKwQR1Nfp8snFwdA.woff" outlineWidth={0.02} outlineColor="#000000">
                GWEI
            </Text>
        </group>
    );
});

export default function GasHologram() {
  const [gasPrice, setGasPrice] = useState<number>(0);

  useEffect(() => {
    let active = true;

    const fetchGas = async () => {
        try {
            const data = await callMcpEndpoint('MCP_ONCHAIN', 'gas_price', {});
            if (active && data && data.gas_price_gwei) {
                setGasPrice(parseFloat(data.gas_price_gwei));
            }
        } catch (err) {
            console.error("Error fetching gas price:", err);
            // No fallback allowed
        }
    };

    fetchGas();
    const interval = setInterval(fetchGas, 15000); // 15 sec
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #14b8a6', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #14b8a6' }}>
              Network Congestion Core
          </h3>
          <div style={{ fontSize: '10px', color: '#14b8a6', background: 'rgba(20, 184, 166, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #14b8a6' }}>
              ETH MAINNET LIVE
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(2,2,5,1) 100%)', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[0, 0, 0]} intensity={2} distance={20} />

              <Stars radius={20} depth={20} count={500} factor={2} saturation={0} fade speed={1} />

              <ReactorCore gasPriceGwei={gasPrice} />

              <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
          </Canvas>

          <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
              STATUS: {gasPrice > 50 ? 'CRITICAL (HIGH FEES)' : gasPrice > 20 ? 'ELEVATED' : 'OPTIMAL'}
          </div>
      </div>
    </div>
  );
}
