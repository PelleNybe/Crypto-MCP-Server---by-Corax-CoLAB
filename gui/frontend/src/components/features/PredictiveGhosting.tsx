import React, { useEffect, useState, useRef } from 'react';
import Plotly from 'plotly.js-basic-dist';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

export default function PredictiveGhosting() {
  const [scrubberValue, setScrubberValue] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const [plotData, setPlotData] = useState<any>(null);
  const { targetSymbol: activeSymbolHook, targetExchange: activeExchange } = useActivePortfolioSymbol();
  const [activeSymbol, setActiveSymbol] = useState('BTC/USDT');

  useEffect(() => {
    let active = true;

    const fetchAndCalculate = async () => {
        try {
            let targetExchange = activeExchange;
            let targetSymbol = activeSymbolHook;

            const ohlcvData = await callMcpEndpoint('MCP_CCXT', 'fetch_ohlcv', { exchange: targetExchange, symbol: targetSymbol, timeframe: '1h', limit: 50 });

            if (!active) return;
            if (!ohlcvData || !Array.isArray(ohlcvData) || ohlcvData.length === 0) return;

            const x = [];
            const y = [];
            for (let i = 0; i < ohlcvData.length; i++) {
                x.push(`T${i - ohlcvData.length + 1}`);
                y.push(ohlcvData[i][4]);
            }

            const currentPrice = y[y.length - 1];
            let trendFactor = 0;
            let volatility = currentPrice * 0.01;

            try {
                const taData = await callMcpEndpoint('MCP_TA', 'compute_indicators', { exchange: targetExchange, symbol: targetSymbol, timeframe: '1h' });
                if (active && taData) {
                    if (taData.signal === 'buy') trendFactor = 0.5;
                    if (taData.signal === 'sell') trendFactor = -0.5;

                    if (taData.bb_upper && taData.bb_lower) {
                        volatility = (taData.bb_upper - taData.bb_lower) / 4;
                    }
                }
            } catch (taErr) {
                console.warn("Could not fetch TA data for prediction, using defaults", taErr);
            }

            const futureSteps = 20;
            const futureX = [];
            let futureY = [];
            let futureLower = [];
            let futureUpper = [];

            try {
                // Call real Monte Carlo simulation from backend (ta_mcp)
                const mcData = await callMcpEndpoint('MCP_TA', 'monte_carlo_simulation', { exchange: targetExchange, symbol: targetSymbol, timeframe: '1h', limit: 100, future_steps: futureSteps, simulations: 1000 });
                if (mcData && mcData.median_path && !mcData.error) {
                    // Remove the first element since it's the current price, to match futureX length
                    futureY = mcData.median_path.slice(1);
                    futureLower = mcData.lower_bound.slice(1);
                    futureUpper = mcData.upper_bound.slice(1);
                    for (let i = 1; i <= futureSteps; i++) {
                        futureX.push(`T${i}`);
                    }
                } else {
                    console.warn("Monte Carlo simulation failed or returned error", mcData);
                    throw new Error("Monte Carlo simulation failed");
                }
            } catch (err) {
                console.error("Error fetching Monte Carlo data", err);
                // No fallback data allowed
            }

            setPlotData({ x, y, futureX, futureY, futureLower, futureUpper });
            setActiveSymbol(targetSymbol);

        } catch (error) {
            console.error("Error generating predictive ghosting:", error);
        }
    };

    fetchAndCalculate();
    const interval = setInterval(fetchAndCalculate, 60000); // refresh every minute

    return () => {
        active = false;
        clearInterval(interval);
    };
  }, [activeSymbolHook, activeExchange]);

  useEffect(() => {
    if (!plotData) return;

    const { x, y, futureX, futureY, futureLower, futureUpper } = plotData;

    const traceHistorical = {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        name: `Historical (${activeSymbol} 1h)`,
        line: { color: '#60a5fa', width: 2 }
    };

    const tracePredictive = {
        x: [...x.slice(-1), ...futureX],
        y: [y[y.length - 1], ...futureY],
        type: 'scatter',
        mode: 'lines',
        name: 'TA Median Projection',
        line: { color: '#10b981', dash: 'dashdot', width: 2 }
    };

    const traceUpper = {
        x: [...x.slice(-1), ...futureX],
        y: [y[y.length - 1], ...futureUpper],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'transparent' },
        showlegend: false
    };

    const traceLower = {
        x: [...x.slice(-1), ...futureX],
        y: [y[y.length - 1], ...futureLower],
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(16, 185, 129, 0.15)',
        line: { color: 'transparent' },
        name: 'Confidence Interval'
    };

    const futureSteps = 20;
    const targetIndex = scrubberValue;
    let traceGhost = null;
    if (targetIndex > 0 && targetIndex <= futureSteps) {
        const targetX = futureX[targetIndex - 1];
        const targetY = futureY[targetIndex - 1];

        traceGhost = {
            x: [targetX],
            y: [targetY],
            type: 'scatter',
            mode: 'markers',
            marker: { size: 12, color: '#ef4444', symbol: 'cross-thin', line: { width: 2, color: '#ef4444' } },
            name: 'Ghost Target Lock'
        };
    }

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#888' },
        margin: { t: 20, b: 30, l: 40, r: 20 },
        xaxis: { showgrid: false },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
        showlegend: true,
        legend: { orientation: 'h', y: 1.1 },
    };

    const traces = [traceHistorical, traceUpper, traceLower, tracePredictive];
    if (traceGhost) traces.push(traceGhost);

    Plotly.react('predictive-chart', traces as any, layout as any, {displayModeBar: false});

  }, [plotData, scrubberValue, activeSymbol]);

  return (
    <div className="card glass-panel interactive-element" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px #10b981' }}>
                TA Trajectory Ghosting
            </h3>
            <div style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10b981' }}>
                PROBABILITY CONES ACTIVE
            </div>
        </div>
        <div id="predictive-chart" style={{ width: '100%', height: '250px' }} ref={chartRef}></div>

        {/* Timeline Scrubber */}
        <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
                <span>Present</span>
                <span style={{ color: scrubberValue > 0 ? '#ef4444' : '#94a3b8' }}>
                    {scrubberValue > 0 ? `T+${scrubberValue} Prediction` : 'Timeline Scrubber'}
                </span>
                <span>Future</span>
            </div>
            <input
                type="range"
                min="0"
                max="20"
                value={scrubberValue}
                onChange={(e) => setScrubberValue(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', background: 'transparent' }}
                className="neon-slider"
            />
        </div>
    </div>
  );
}
