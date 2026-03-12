import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Wireframe, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AICoreShape({ active }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += active ? 0.05 : 0.01;
      meshRef.current.rotation.y += active ? 0.05 : 0.01;

      // Pulse effect
      const scale = active ? 1.2 + Math.sin(state.clock.elapsedTime * 10) * 0.1 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <MeshDistortMaterial
        color={active ? "#ff00ff" : "#00ffff"}
        emissive={active ? "#ff00ff" : "#00ffff"}
        emissiveIntensity={2}
        transparent
        opacity={0.8}
        distort={active ? 0.4 : 0.2}
        speed={active ? 5 : 2}
        roughness={0}
      />
      <Wireframe stroke={"#ffffff"} thickness={active ? 0.05 : 0.02} />
    </mesh>
  );
}

function ParticleField({ active }) {
    const particlesRef = useRef();
    const particleCount = 200;

    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i++) {
        positions[i] = (Math.random() - 0.5) * 5;
    }

    useFrame(() => {
        if(particlesRef.current) {
            particlesRef.current.rotation.y -= active ? 0.02 : 0.005;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={positions.length/3} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color={active ? "#ff00ff" : "#00ffff"} transparent opacity={0.6} sizeAttenuation />
        </points>
    )
}

export default function HolographicAICore() {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Simulate intercepting WebSocket JSON-RPC calls
    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 800 + Math.random() * 1000);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
            <h3 style={{ margin: 0 }}>
                <span style={{ color: isProcessing ? '#ff00ff' : '#00ffff', textShadow: `0 0 10px ${isProcessing ? 'rgba(255,0,255,0.5)' : 'rgba(0,255,255,0.5)'}`, transition: 'all 0.3s' }}>
                    🤖 Holographic AI Core
                </span>
            </h3>
            <span style={{fontSize: '10px', color: isProcessing ? '#ff00ff' : '#00ffff', border: `1px solid ${isProcessing ? '#ff00ff' : '#00ffff'}`, padding: '2px 6px', borderRadius: '4px'}}>
                {isProcessing ? 'PROCESSING RPC' : 'IDLE'}
            </span>
        </div>
      <p className="small-muted" style={{ marginBottom: '10px' }}>Claude Local Agent Embodiment</p>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)', background: 'radial-gradient(circle at center, rgba(0,255,255,0.05) 0%, transparent 70%)' }}>
        <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} color="#ffffff" intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#ff00ff" intensity={0.5} />
          <AICoreShape active={isProcessing} />
          <ParticleField active={isProcessing} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={isProcessing ? 5 : 1} />
        </Canvas>
      </div>
    </div>
  );
}
