import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = Array.from({ length: columns }).fill(1) as number[];

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor((Math.sin(Date.now()) * 0.5 + 0.5) * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && (Math.sin(Date.now()) * 0.5 + 0.5) > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        let animationFrameId: number;
        let lastDrawTime = 0;
        const fps = 30;
        const fpsInterval = 1000 / fps;

        const loop = (time: number) => {
            animationFrameId = requestAnimationFrame(loop);
            const elapsed = time - lastDrawTime;
            if (elapsed > fpsInterval) {
                lastDrawTime = time - (elapsed % fpsInterval);
                draw();
            }
        };
        animationFrameId = requestAnimationFrame(loop);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, opacity: 0.15, pointerEvents: 'none' }} />;
};

export default MatrixRain;
