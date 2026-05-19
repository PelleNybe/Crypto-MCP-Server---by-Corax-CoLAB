import React, { useRef, useState, useEffect } from 'react';
import { callMcpEndpoint } from '../../api_mcp';

export default function WhaleSonarSweep() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);
  const [blips, setBlips] = useState<any[]>([]);

  // Fetch real data to create sonar blips
  useEffect(() => {
    let active = true;

    const fetchSonarData = async () => {
      try {
        // We use CoinGecko trending as a proxy for market activity
        const trendingData = await callMcpEndpoint('MCP_COINGECKO', 'trending', {});

        if (!active) return;

        if (trendingData && trendingData.coins) {
          const newBlips = trendingData.coins.map((coinWrapper: any, index: number) => {
            const coin = coinWrapper.item;

            // Generate deterministic angle and distance so they don't jump around on every render
            // Just spreading them out based on their ID string
            let seed = 0;
            for (let i = 0; i < coin.id.length; i++) {
                seed += coin.id.charCodeAt(i);
            }

            const blipAngle = (seed % 360);
            const distance = 0.2 + ((seed % 100) / 100) * 0.7; // Between 0.2 and 0.9

            // Size based on market cap rank (smaller rank = bigger blip)
            const rank = coin.market_cap_rank || 100;
            const size = Math.max(3, 10 - (rank / 20));

            // Color based on rank
            let severity = 'green';
            if (rank <= 10) severity = 'red'; // High impact
            else if (rank <= 50) severity = 'yellow'; // Medium impact

            return {
              id: coin.id,
              angle: blipAngle,
              distance: distance,
              size: size,
              label: `${coin.symbol.toUpperCase()} #${rank}`,
              age: 0,
              severity: severity
            };
          });

          setBlips(newBlips);
        }
      } catch (err) {
        console.error("Sonar fetch error", err);
      }
    };

    fetchSonarData();
    let timeoutId: NodeJS.Timeout;

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

  useEffect(() => {
    let animationId: number;
    let currentAngle = 0;

    const animate = () => {
      currentAngle = (currentAngle + 0.02) % (Math.PI * 2);
      setAngle(currentAngle);

      // Update blip age
      setBlips(prev => prev.map(b => {
        // Find angle difference
        const blipRad = b.angle * (Math.PI / 180);
        let diff = currentAngle - blipRad;
        if (diff < 0) diff += Math.PI * 2;

        // If the sweep just passed it, reset age
        if (diff > 0 && diff < 0.1) {
            return { ...b, age: 0 };
        }

        return { ...b, age: Math.min(255, b.age + 1) };
      }));

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw base radar circles
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

    // Draw Sweeper
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sweeper gradient trailing
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle - 0.5, angle, false);
    ctx.lineTo(cx, cy);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Blips
    blips.forEach(blip => {
      const blipRad = blip.angle * (Math.PI / 180);
      const bx = cx + Math.cos(blipRad) * (radius * blip.distance);
      const by = cy + Math.sin(blipRad) * (radius * blip.distance);

      const opacity = Math.max(0, 1 - (blip.age / 200));

      if (opacity > 0) {
          ctx.beginPath();
          ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
          const color = blip.severity === 'red' ? '239, 68, 68' : blip.severity === 'yellow' ? '245, 158, 11' : '16, 185, 129';
          ctx.fillStyle = `rgba(${color}, ${opacity})`;
          ctx.fill();

          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${color}, 1)`;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          // Label
          if (opacity > 0.5) {
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.font = '10px monospace';
              ctx.fillText(blip.label, bx + 10, by + 4);
          }
      }
    });

  }, [angle, blips]);

  return (
    <div className="card interactive-element" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#020205', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#10b981', fontFamily: 'monospace', fontSize: '12px' }}>
        MARKET SONAR SWEEP ACTIVE
      </div>
      <canvas ref={canvasRef} width={300} height={300} style={{ background: 'transparent' }} />
    </div>
  );
}
