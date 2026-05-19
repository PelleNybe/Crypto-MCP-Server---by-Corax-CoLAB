import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';

const Word = React.memo(({ text, sentiment, position, index, weight }: { text: string, sentiment: string, position: [number, number, number], index: number, weight: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const color = sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#cbd5e1';

    // Scale size based on weight (frequency of occurrence)
    const size = Math.min(1.5, 0.5 + (weight * 0.2));

    useFrame((state) => {
        if (meshRef.current) {
            // Make them face the camera (billboard)
            meshRef.current.quaternion.copy(state.camera.quaternion);
            // Slight hover effect and continuous slow rotation of the sphere
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + index) * 0.005;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <Text
                fontSize={size}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02 * size}
                outlineColor="#000000"
                font="https://fonts.gstatic.com/s/orbitron/v25/yq5yMKwQR1Nfp8snFwdA.woff"
            >
                {text}
            </Text>
        </mesh>
    );
});

export default function SentimentWordCloud() {
  const [words, setWords] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const fetchNews = async () => {
        try {
            const data = await callMcpEndpoint('MCP_NEWS', 'get_latest_news', { limit: 50 });
            if (active && data && data.news) {
                const newWords: any[] = [];
                const radius = 6;

                // Extract unique currencies/keywords
                const keywordsMap: Record<string, {count: number, sentiment: string}> = {};

                data.news.forEach((n: any) => {
                    if (n.currencies) {
                        n.currencies.forEach((c: string) => {
                            if (!keywordsMap[c]) keywordsMap[c] = { count: 0, sentiment: n.sentiment };
                            keywordsMap[c].count++;
                            // Override neutral if a polarized article appears
                            if (n.sentiment !== 'neutral') keywordsMap[c].sentiment = n.sentiment;
                        });
                    }
                });

                const keys = Object.keys(keywordsMap);

                // No fallback data

                keys.forEach((k, i) => {
                    // Golden ratio distribution on sphere
                    const phi = Math.acos(-1 + (2 * i) / keys.length);
                    const theta = Math.sqrt(keys.length * Math.PI) * phi;

                    const x = radius * Math.cos(theta) * Math.sin(phi);
                    const y = radius * Math.sin(theta) * Math.sin(phi);
                    const z = radius * Math.cos(phi);

                    newWords.push({
                        text: k.toUpperCase(),
                        sentiment: keywordsMap[k].sentiment,
                        weight: keywordsMap[k].count,
                        position: [x, y, z]
                    });
                });

                setWords(newWords);
            }
        } catch (err) {
            console.error("Error fetching news for Word Cloud:", err);
        }
    };

    fetchNews();
    let timeoutId: NodeJS.Timeout;

    const fetchNewsWithPolling = async () => {
      try {
        await fetchNews();
      } finally {
        if (active) timeoutId = setTimeout(fetchNewsWithPolling, 120000);
      }
    };

    fetchNewsWithPolling();
    return () => { active = false; clearTimeout(timeoutId); };
  }, []);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #3b82f6', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #3b82f6' }}>
              AI Sentiment Sphere
          </h3>
          <div style={{ fontSize: '10px', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #3b82f6' }}>
              NEWS ANALYSIS LIVE
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020205', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 0, 16], fov: 50 }}>
              <ambientLight intensity={1} />
              <fog attach="fog" args={['#020205', 10, 25]} />

              <group>
                  {words.map((w, i) => (
                      <Word key={i} index={i} text={w.text} sentiment={w.sentiment} position={w.position} weight={w.weight} />
                  ))}
              </group>

              {/* Connecting lines sphere effect */}
              <mesh>
                  <sphereGeometry args={[5.8, 16, 16]} />
                  <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.05} />
              </mesh>

              <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} autoRotate={true} autoRotateSpeed={1.2} />
          </Canvas>

          <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#10b981', fontSize: '10px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block'}}></span>
                  BULLISH
              </span>
              <span style={{ color: '#ef4444', fontSize: '10px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block'}}></span>
                  BEARISH
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '10px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{width: '6px', height: '6px', background: '#cbd5e1', borderRadius: '50%', display: 'inline-block'}}></span>
                  NEUTRAL
              </span>
          </div>
      </div>
    </div>
  );
}
