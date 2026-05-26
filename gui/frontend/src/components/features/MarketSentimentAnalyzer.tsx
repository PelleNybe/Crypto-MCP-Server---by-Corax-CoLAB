import React, { useState, useEffect } from 'react';
import { BrainCircuit, Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { callMcpEndpoint } from '../../api_mcp';
import { useActivePortfolioSymbol } from '../../hooks/useActivePortfolioSymbol';

export default function MarketSentimentAnalyzer() {
  const [sentiment, setSentiment] = useState<'neutral' | 'bullish' | 'bearish' | 'loading'>('loading');
  const [analysis, setAnalysis] = useState<string>('Initializing AI analysis module...');
  const [confidence, setConfidence] = useState<number>(0);
  const { targetSymbol: activeSymbol } = useActivePortfolioSymbol();

  useEffect(() => {
    const fetchSentiment = async () => {
      setSentiment('loading');
      setAnalysis('Querying LLM MCP for latest market data synthesis...');

      try {
        const targetExchange = 'binance';
        const targetSymbol = activeSymbol;

        const btcTickerResp = await callMcpEndpoint('MCP_CCXT', 'get_ticker', { exchange: targetExchange, symbol: targetSymbol });

        let tickerStr = `Current ${targetSymbol} price unavailable.`;
        if (btcTickerResp && btcTickerResp.last) {
            tickerStr = `Current ${targetSymbol} price is ${btcTickerResp.last}.`;
        }

        const prompt = `As an expert crypto AI, analyze the current market sentiment. ${tickerStr} Respond with ONLY a JSON object in this exact format, with no markdown or other text: {"sentiment": "bullish|bearish|neutral", "confidence": 0-100, "analysis": "A concise 2-sentence explanation."}`;

        const response = await callMcpEndpoint('MCP_LLM', 'generate_text', { prompt: prompt, max_tokens: 150, temperature: 0.3 });

        if (response && response.response) {
            try {
                let jsonStr = response.response.trim();
                if (jsonStr.startsWith('```json')) {
                    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                } else if (jsonStr.startsWith('```')) {
                    jsonStr = jsonStr.replace(/```/g, '').trim();
                }

                const parsed = JSON.parse(jsonStr);

                if (parsed.sentiment && ['bullish', 'bearish', 'neutral'].includes(parsed.sentiment.toLowerCase())) {
                    setSentiment(parsed.sentiment.toLowerCase() as any);
                    setAnalysis(parsed.analysis || "Analysis received.");
                    setConfidence(parsed.confidence || 85);
                } else {
                    throw new Error("Invalid format");
                }

            } catch (parseError) {
                console.error("Failed to parse LLM response as JSON:", response.response);
                const text = response.response.toLowerCase();
                let detectedSentiment = 'neutral';
                if (text.includes('bullish') || text.includes('uptrend')) detectedSentiment = 'bullish';
                if (text.includes('bearish') || text.includes('downtrend')) detectedSentiment = 'bearish';

                setSentiment(detectedSentiment as any);
                setAnalysis(response.response.substring(0, 200) + "...");
                setConfidence(75);
            }
        } else {
            throw new Error("Empty response from LLM");
        }

      } catch (err) {
        console.error("Error fetching sentiment:", err);
        setSentiment('neutral');
        setAnalysis('Unable to reach LLM MCP. Relying on default heuristics.');
        setConfidence(50);
      }
    };

    fetchSentiment();
    let timeoutId: NodeJS.Timeout;

    const fetchSentimentWithPolling = async () => {
      try {
        await fetchSentiment();
      } finally {
        if (active) timeoutId = setTimeout(fetchSentimentWithPolling, 60000);
      }
    };

    fetchSentimentWithPolling();
    return () => clearTimeout(timeoutId);
  }, [activeSymbol]);

  const getStyleColor = () => {
    if (sentiment === 'bullish') return '#10b981';
    if (sentiment === 'bearish') return '#ef4444';
    if (sentiment === 'neutral') return '#3b82f6';
    return '#8b5cf6';
  };

  const Icon = sentiment === 'bullish' ? TrendingUp : sentiment === 'bearish' ? TrendingDown : sentiment === 'neutral' ? Minus : Activity;

  return (
    <div className="card interactive-element" style={{ gridColumn: '1 / -1', minHeight: '150px', position: 'relative', overflow: 'hidden', backgroundColor: '#050510', borderLeft: `4px solid ${getStyleColor()}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <BrainCircuit size={24} color={getStyleColor()} />
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', color: getStyleColor() }}>AI Market Sentiment Analyzer</h3>
        {sentiment !== 'loading' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a3a3a3', background: '#111', padding: '4px 8px', borderRadius: '4px' }}>
            <Activity size={14} />
            <span>CONFIDENCE: {confidence}%</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          padding: '15px',
          borderRadius: '8px',
          border: `1px solid ${getStyleColor()}40`,
          minWidth: '120px'
        }}>
          <Icon size={32} color={getStyleColor()} style={{ marginBottom: '8px', animation: sentiment === 'loading' ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: getStyleColor(), letterSpacing: '2px', fontSize: '14px' }}>
            {sentiment}
          </span>
        </div>

        <div style={{ flex: 1, fontFamily: 'monospace', lineHeight: '1.6', color: '#e5e5e5', fontSize: '14px' }}>
          {sentiment === 'loading' ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8b5cf6' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                {analysis}
             </div>
          ) : (
            <p style={{ margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              <span style={{ color: '#888', marginRight: '8px' }}>&gt;</span>
              {analysis}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
