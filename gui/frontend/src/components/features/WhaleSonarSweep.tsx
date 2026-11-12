import React, { useRef, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';

interface SonarBlip {
  id: string;
  angle: number;
  distance: number;
  size: number;
  label: string;
  age: number;
  severity: 'red' | 'yellow' | 'green';
}

export default function WhaleSonarSweep() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef<number>(0);
  const blipsRef = useRef<SonarBlip[]>([]);

  // Fetch real CoinGecko trending data to populate sonar blips
  useEffect(() => {
    let active = true;

    const fetchSonarData = async () => {
      try {
        const trendingData = await callMcpEndpoint('MCP_COINGECKO', 'trending', {});
        if (!active) return;

        if (trendingData && trendingData.coins) {
          const totalCoins = Math.max(1, trendingData.coins.length);
          const newBlips: SonarBlip[] = trendingData.coins.map((coinWrapper: any, index: number) => {
            const coin = coinWrapper.item;
            const rank = coin.market_cap_rank || 100;
            const pct24h = Number(coin.data?.price_change_percentage_24h?.usd ?? 0);

            // Distribute evenly around radar by trending score/index, distance by market cap rank
            const blipAngle = (index / totalCoins) * 360 + (pct24h % 30);
            const distance = Math.min(0.92, Math.max(0.18, 0.18 + Math.min(rank, 200) / 260));
            const size = Math.max(3, Math.min(10, 10 - rank / 20));

            let severity: 'red' | 'yellow' | 'green' = 'green';
            if (rank <= 10 || Math.abs(pct24h) >= 15) severity = 'red';
            else if (rank <= 50 || Math.abs(pct24h) >= 5) severity = 'yellow';

            const symbolUpper = (coin.symbol || '').toUpperCase();
            return {
              id: coin.id,
              angle: blipAngle,
              distance,
              size,
              label: `${symbolUpper} #${rank}`,
              age: 0,
              severity,
            };
          });

          blipsRef.current = newBlips;
        }
      } catch (err) {
        console.error('Sonar fetch error', err);
      }
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const fetchSonarDataWithPolling = async () => {
      try {
        await fetchSonarData();
      } finally {
        if (active) timeoutId = setTimeout(fetchSonarDataWithPolling, 60000);
      }
    };

    fetchSonarDataWithPolling();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Single 60 FPS canvas render loop using refs (zero React re-renders per frame)
  useEffect(() => {
    let animationId: number;

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          angleRef.current = (angleRef.current + 0.02) % (Math.PI * 2);
          const angle = angleRef.current;

          const width = canvas.width;
          const height = canvas.height;
          const cx = width / 2;
          const cy = height / 2;
          const radius = Math.min(cx, cy) - 20;

          ctx.clearRect(0, 0, width, height);

          // Base radar circles
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.lineWidth = 1;
          for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (radius / 4) * i, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx, cy + radius);
          ctx.moveTo(cx - radius, cy);
          ctx.lineTo(cx + radius, cy);
          ctx.stroke();

          // Sweeper line
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Sweeper gradient trail
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, angle - 0.5, angle, false);
          ctx.lineTo(cx, cy);
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
          ctx.fillStyle = gradient;
          ctx.fill();

          // Update & draw blips
          for (const blip of blipsRef.current) {
            const blipRad = blip.angle * (Math.PI / 180);
            let diff = angle - blipRad;
            if (diff < 0) diff += Math.PI * 2;
            blip.age = diff > 0 && diff < 0.1 ? 0 : Math.min(255, blip.age + 1);

            const bx = cx + Math.cos(blipRad) * (radius * blip.distance);
            const by = cy + Math.sin(blipRad) * (radius * blip.distance);
            const opacity = Math.max(0, 1 - blip.age / 200);

            if (opacity > 0) {
              ctx.beginPath();
              ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
              const color =
                blip.severity === 'red'
                  ? '239, 68, 68'
                  : blip.severity === 'yellow'
                  ? '245, 158, 11'
                  : '16, 185, 129';
              ctx.fillStyle = `rgba(${color}, ${opacity})`;
              ctx.fill();

              ctx.shadowBlur = 10;
              ctx.shadowColor = `rgba(${color}, 1)`;
              ctx.stroke();
              ctx.shadowBlur = 0;

              if (opacity > 0.5) {
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.font = '10px monospace';
                ctx.fillText(blip.label, bx + 10, by + 4);
              }
            }
          }
        }
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="card interactive-element" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#020205', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#10b981', fontFamily: 'monospace', fontSize: '12px' }}>
        MARKET SONAR SWEEP ACTIVE
      </div>
      <canvas ref={canvasRef} width={300} height={300} style={{ background: 'transparent' }} />
    </div>
  );
}
