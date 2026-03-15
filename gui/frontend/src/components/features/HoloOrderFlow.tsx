import React, { useRef, useMemo, useState, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Box, Text } from '@react-three/drei';
import * as THREE from 'three';

const Wall = ({ type, price, volume, maxVolume, index }: { type: 'bid' | 'ask', price: number, volume: number, maxVolume: number, index: number }) => {
  const height = maxVolume > 0 ? (volume / maxVolume) * 5 : 0;
  const color = type === 'bid' ? '#10b981' : '#ef4444'; // Green for bids, Red for asks
  const positionX = type === 'bid' ? -index * 0.3 - 0.5 : index * 0.3 + 0.5;

  return (
    <group position={[positionX, height / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.2, height, 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={0.5} wireframe={true} />
      </mesh>

      {/* Solid core */}
      <mesh>
         <boxGeometry args={[0.15, height * 0.95, 1.8]} />
         <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {index % 5 === 0 && (
        <Text
          position={[0, height / 2 + 0.5, 0]}
          color={color}
          fontSize={0.2}
          anchorX="center"
          anchorY="middle"
        >
          {price.toFixed(1)}
        </Text>
      )}
    </group>
  );
};

export default function HoloOrderFlow({ price, symbol }: { price: number, symbol: string }) {
  const [bids, setBids] = useState<{price: number, volume: number}[]>([]);
  const [asks, setAsks] = useState<{price: number, volume: number}[]>([]);
  const [maxVolume, setMaxVolume] = useState<number>(1);

  useEffect(() => {
    let active = true;

    const fetchOrderBook = async () => {
      try {
        const orderBook = await callMcpEndpoint('MCP_CCXT', 'fetch_order_book', {
          exchange: 'binance',
          symbol: symbol || 'BTC/USDT',
          limit: 30
        });

        if (!active) return;

        if (orderBook && orderBook.bids && orderBook.asks) {
          const parsedBids = orderBook.bids.slice(0, 30).map((b: any[]) => ({ price: b[0], volume: b[1] }));
          const parsedAsks = orderBook.asks.slice(0, 30).map((a: any[]) => ({ price: a[0], volume: a[1] }));

          let localMax = 0;
          parsedBids.forEach((b: any) => localMax = Math.max(localMax, b.volume));
          parsedAsks.forEach((a: any) => localMax = Math.max(localMax, a.volume));

          setBids(parsedBids);
          setAsks(parsedAsks);
          setMaxVolume(localMax > 0 ? localMax : 1);
        }
      } catch (err) {
        console.error("Failed to fetch order book for HoloOrderFlow", err);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000); // refresh every 5s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [symbol]);


  return (
    <div style={{ width: '100%', height: '300px', background: '#050505', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        {/* Grid Floor */}
        <gridHelper args={[20, 20, '#10b981', '#222222']} position={[0, 0, 0]} />

        {/* Current Price Marker */}
        <group position={[0, 0, 0]}>
           <mesh position={[0, 2.5, 0]}>
             <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
             <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
           </mesh>
           <Text position={[0, 5.5, 0]} color="#ffffff" fontSize={0.4} outlineWidth={0.05} outlineColor="#000000">
             {price ? price.toFixed(2) : 'Loading...'}
           </Text>
        </group>

        {/* Render Bids */}
        {bids.map((bid, index) => (
          <Wall key={`bid-${index}`} type="bid" price={bid.price} volume={bid.volume} maxVolume={maxVolume} index={index} />
        ))}

        {/* Render Asks */}
        {asks.map((ask, index) => (
          <Wall key={`ask-${index}`} type="ask" price={ask.price} volume={ask.volume} maxVolume={maxVolume} index={index} />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#10b981', fontSize: '12px', fontFamily: 'monospace', textShadow: '0 0 5px #10b981' }}>
        HOLOGRAPHIC DEPTH: BIDS
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 10, color: '#ef4444', fontSize: '12px', fontFamily: 'monospace', textShadow: '0 0 5px #ef4444' }}>
        HOLOGRAPHIC DEPTH: ASKS
      </div>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace' }}>
        DRAG TO INSPECT LIQUIDITY POOLS
      </div>
    </div>
  );
}
