import React, { useRef, useMemo, useState, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import ForceGraph3D from 'react-force-graph-3d';

const SentimentParticle = ({ position, sentiment }: { position: THREE.Vector3, sentiment: 'bullish' | 'bearish' | 'neutral' }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const color = sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#6366f1';

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position.x) * 0.01;
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
        </mesh>
    );
};

export default function NewsSingularity() {
    const [news, setNews] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
    const graphRef = useRef<any>(null);

    useEffect(() => {
        let active = true;

        const fetchMarketDataAndCreateNews = async () => {
            try {
                // Fetches latest news from News MCP using CryptoPanic API
                const trendingData = await callMcpEndpoint('MCP_NEWS', 'get_latest_news', {limit: 15});

                if (!active) return;

                if (trendingData && trendingData.news) {
                    // Create nodes
                    const newNodes = trendingData.news.map((coinWrapper: any, index: number) => {
                        const coin = coinWrapper;

                        // Sentiment based on 24h price change
                        // In a real scenario, this would come from a sentiment analysis MCP
                        const priceChange = coin.sentiment === 'bullish' ? 6 : coin.sentiment === 'bearish' ? -6 : 0;
                        let sentiment = 'neutral';
                        if (priceChange > 5) sentiment = 'bullish';
                        else if (priceChange < -5) sentiment = 'bearish';
                        else sentiment = priceChange > 0 ? 'bullish' : 'bearish';

                        return {
                            id: `${coin.id}-${index}`, // Unique identifier
                            text: `News: ${coin.title}`,
                            sentiment: sentiment,
                            val: 1.5,
                            color: sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#6366f1'
                        };
                    });

                    // Create some arbitrary links between top trending coins to form a cluster
                    const newLinks = [];
                    for (let i = 0; i < newNodes.length; i++) {
                        for (let j = i + 1; j < newNodes.length; j++) {
                            // Link nodes if they share sentiment or are part of the same data cluster
                            if (newNodes[i].sentiment === newNodes[j].sentiment || i % 3 === j % 3) {
                                newLinks.push({
                                    source: newNodes[i].id,
                                    target: newNodes[j].id
                                });
                            }
                        }
                    }

                    setGraphData({ nodes: newNodes, links: newLinks });
                    setNews(newNodes);
                }
            } catch (err) {
                console.error("NewsSingularity fetch error", err);
            }
        };

        fetchMarketDataAndCreateNews();
        let timeoutId: NodeJS.Timeout;

    const fetchMarketDataAndCreateNewsWithPolling = async () => {
      try {
        await fetchMarketDataAndCreateNews();
      } finally {
        if (active) timeoutId = setTimeout(fetchMarketDataAndCreateNewsWithPolling, 60000);
      }
    };

    fetchMarketDataAndCreateNewsWithPolling();

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="card interactive-element" style={{ gridColumn: 'span 1', height: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                <h3 style={{ margin: 0, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>
                    News Singularity Web
                </h3>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                {graphData.nodes.length > 0 ? (
                    <ForceGraph3D
                        ref={graphRef}
                        graphData={graphData}
                        nodeAutoColorBy="sentiment"
                        nodeColor={node => node.color}
                        nodeLabel="text"
                        linkWidth={0.5}
                        linkOpacity={0.2}
                        linkColor={() => '#334155'}
                        backgroundColor="#050505"
                        width={600} // Approximate width, ideally would be responsive
                        height={340}
                        showNavInfo={false}
                        nodeResolution={16}
                        nodeRelSize={4}
                    />
                ) : (
                    <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>
                        Establishing uplink to global crypto news nodes...
                    </div>
                )}
            </div>

            {/* Overlay ticker of the top news item */}
            {news.length > 0 && (
                 <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.8)',
                    padding: '10px',
                    borderTop: `1px solid ${news[0].color}`,
                    color: news[0].color,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                 }}>
                     <div className="ticker-content">LATEST ANOMALY: {news[0].text}</div>

                 <style>{`
                    .ticker-content {
                        display: inline-block;
                        white-space: nowrap;
                        animation: ticker 15s linear infinite;
                    }
                    @keyframes ticker {
                        0% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                 `}</style>

                 </div>
            )}
        </div>
    );
}
