import React, { useRef, useMemo, useState, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const Wall = ({ type, price, volume, maxVolume, index }: { type: 'bid' | 'ask', price: number, volume: number, maxVolume: number, index: number }) => {
  const height = maxVolume > 0 ? (volume / maxVolume) * 5 : 0.1;
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

export default function HoloTopographicOrderBook() {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [], maxVolume: 1 });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    let active = true;
    const fetchOrderBook = async () => {
      try {
        let targetExchange = 'binance';
        let targetSymbol = activeSymbol;

        // Fetch real order book from CCXT
        const obData = await callMcpEndpoint('MCP_CCXT', 'fetch_order_book', { exchange: targetExchange, symbol: targetSymbol, limit: 30 });
        const tickerData = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: targetExchange, symbol: targetSymbol });

        if (!active || !obData || !obData.bids || !obData.asks) return;

        if (tickerData && tickerData.last) {
            setCurrentPrice(tickerData.last);
        }

        const bids = obData.bids.map((b: any[]) => ({ price: b[0], volume: b[1] }));
        const asks = obData.asks.map((a: any[]) => ({ price: a[0], volume: a[1] }));

        let maxVolume = 0;
        bids.forEach((b: any) => maxVolume = Math.max(maxVolume, b.volume));
        asks.forEach((a: any) => maxVolume = Math.max(maxVolume, a.volume));

        setOrderBook({ bids, asks, maxVolume });
      } catch (err) {
        console.error("Failed to fetch order book data", err);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 10000); // Poll every 10s
    return () => { active = false; clearInterval(interval); };
  }, [activeSymbol]);

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%', boxShadow: '0 0 10px #60a5fa' }}></div>
        Holographic Liquidity Trench ({activeSymbol})
      </h3>

      <div style={{ width: '100%', height: '350px', background: '#050505', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
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
               {currentPrice ? currentPrice.toFixed(2) : 'Loading...'}
             </Text>
          </group>

          {/* Render Bids */}
          {orderBook.bids.map((bid: any, index: number) => (
            <Wall key={`bid-${index}`} type="bid" price={bid.price} volume={bid.volume} maxVolume={orderBook.maxVolume} index={index} />
          ))}

          {/* Render Asks */}
          {orderBook.asks.map((ask: any, index: number) => (
            <Wall key={`ask-${index}`} type="ask" price={ask.price} volume={ask.volume} maxVolume={orderBook.maxVolume} index={index} />
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
    </div>
  );
}
