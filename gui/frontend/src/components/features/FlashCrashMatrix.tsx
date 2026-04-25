import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

const MatrixBar = React.memo(({ position, height, color, label }: { position: [number, number, number], height: number, color: string, label: string }) => {
    return (
        <group position={position}>
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[0.8, height, 0.8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
            <Text position={[0, -0.5, 0]} fontSize={0.3} color="#cbd5e1" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
                {label}
            </Text>
        </group>
    );
});

export default function FlashCrashMatrix() {
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const { targetSymbol: activeSymbolHook, targetExchange: activeExchange } = useActivePortfolioSymbol();

  useEffect(() => {
    let active = true;

    const fetchOrderBook = async () => {
        try {
            const obData = await callMcpEndpoint('MCP_CCXT', 'fetch_order_book', { exchange: activeExchange, symbol: activeSymbolHook, limit: 100 });
            if (!active || !obData || !obData.bids || !obData.asks) return;

            // Group into 10 price buckets
            const numBuckets = 10;
            const buckets: any[] = [];

            const highestBid = obData.bids[0][0];
            const lowestAsk = obData.asks[0][0];
            const midPrice = (highestBid + lowestAsk) / 2;

            // Analyze a range of +/- 5% around mid price
            const range = midPrice * 0.05;
            const bucketSize = range / (numBuckets / 2);

            let maxVol = 0;

            for (let i = 0; i < numBuckets; i++) {
                const priceTarget = midPrice - range + (i * bucketSize);

                let bidVol = 0;
                let askVol = 0;

                obData.bids.forEach((b: any) => {
                    if (Math.abs(b[0] - priceTarget) <= bucketSize / 2) bidVol += b[1];
                });

                obData.asks.forEach((a: any) => {
                    if (Math.abs(a[0] - priceTarget) <= bucketSize / 2) askVol += a[1];
                });

                const totalVol = bidVol + askVol;
                if (totalVol > maxVol) maxVol = totalVol;

                buckets.push({
                    price: priceTarget,
                    bidVol,
                    askVol,
                    imbalance: bidVol - askVol,
                    totalVol
                });
            }

            // Normalize heights
            buckets.forEach(b => {
                b.normalizedHeight = maxVol > 0 ? (b.totalVol / maxVol) * 5 : 0;
            });

            setMatrixData(buckets);
        } catch (err) {
            console.error("Error fetching orderbook for Flash Crash Matrix:", err);
        }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000); // Fast updates
    return () => { active = false; clearInterval(interval); };
  }, [activeSymbolHook, activeExchange]);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #ef4444', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #ef4444' }}>
              Flash-Crash Matrix
          </h3>
          <div style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ef4444' }}>
              3D ORDERBOOK
          </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020205', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <gridHelper args={[12, 12, '#334155', '#1e293b']} position={[0, -0.01, 0]} />

              <group position={[-4.5, 0, 0]}>
                  {matrixData.map((bucket, i) => {
                      const color = bucket.imbalance > 0 ? '#10b981' : '#ef4444'; // Green if more bids, Red if more asks
                      const height = Math.max(0.1, bucket.normalizedHeight);

                      return (
                          <MatrixBar
                              key={i}
                              position={[i, 0, 0]}
                              height={height}
                              color={color}
                              label={`$${bucket.price.toFixed(0)}`}
                          />
                      );
                  })}
              </group>

              <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} autoRotate={true} autoRotateSpeed={0.5} />
          </Canvas>

          <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
              ANALYZING LIQUIDITY: {activeSymbolHook}
          </div>
      </div>
    </div>
  );
}
