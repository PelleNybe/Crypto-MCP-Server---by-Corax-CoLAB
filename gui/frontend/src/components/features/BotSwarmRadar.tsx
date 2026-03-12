import React, { useState, useEffect, useRef } from 'react';

export default function BotSwarmRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bots, setBots] = useState([]);

  useEffect(() => {
    // Generate mock active Freqtrade bots
    const initialBots = Array.from({ length: 8 }).map((_, i) => ({
      id: `FT-Bot-${i}`,
      angle: Math.random() * Math.PI * 2,
      distance: 20 + Math.random() * 100, // Distance from center
      status: Math.random() > 0.8 ? 'TRADE' : 'SCAN',
      lastUpdate: Date.now() - Math.random() * 10000
    }));
    setBots(initialBots);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    let animationFrameId;

    const drawRadar = () => {
      // Fade effect for radar sweep
      ctx.fillStyle = 'rgba(2, 2, 5, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid circles
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for(let i=1; i<=4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (i/4), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();

      // Radar sweep line
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      const gradient = ctx.createLinearGradient(0, 0, 0, -radius);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -radius);
      ctx.lineTo(20, -radius); // sweep width
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // Draw bots
      bots.forEach(bot => {
        const botX = centerX + Math.cos(bot.angle) * bot.distance;
        const botY = centerY + Math.sin(bot.angle) * bot.distance;

        // Check if sweep passed bot
        const sweepAngle = (angle - Math.PI/2 + Math.PI*2) % (Math.PI*2);
        const botAngle = (bot.angle + Math.PI*2) % (Math.PI*2);
        const diff = Math.abs(sweepAngle - botAngle);

        if (diff < 0.2 || (Math.PI*2 - diff) < 0.2) {
            // Ping effect
            ctx.beginPath();
            ctx.arc(botX, botY, 8, 0, Math.PI*2);
            ctx.fillStyle = bot.status === 'TRADE' ? '#ff00ff' : '#00ffff';
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;

            // Draw Target label
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(bot.id, botX + 10, botY - 5);
            ctx.shadowBlur = 0;
        } else {
             // Normal state
            ctx.beginPath();
            ctx.arc(botX, botY, 3, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
        }
      });

      angle += 0.05;
      animationFrameId = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => cancelAnimationFrame(animationFrameId);
  }, [bots]);

  return (
    <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
            <h3 style={{ margin: 0 }}>
                <span style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>🛰️ Bot Swarm Radar</span>
            </h3>
            <span style={{fontSize: '10px', color: '#00ffff', border: `1px solid #00ffff`, padding: '2px 6px', borderRadius: '4px'}}>
                FREQTRADE: ONLINE
            </span>
        </div>
      <p className="small-muted" style={{ marginBottom: '10px' }}>Active fleet monitoring & execution signals</p>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020205' }}>
        <canvas
            ref={canvasRef}
            width={300}
            height={250}
            style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.2))' }}
        />

        {/* Terminal overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, pointerEvents: 'none' }}>
            {bots.slice(0, 3).map((bot, i) => (
                <div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', color: bot.status === 'TRADE' ? '#ff00ff' : '#00ffff', background: 'rgba(0,0,0,0.5)', padding: '2px 5px', marginBottom: '2px' }}>
                    &gt; {bot.id} | {bot.status} | {(bot.distance/10).toFixed(2)}km
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
