import { authenticatedFetch } from "../auth"
import React, { useEffect, useState } from 'react'
import socket from '../socket'
import HoloOrderFlow from './features/HoloOrderFlow'
import CyberpunkLoader from './CyberpunkLoader'

export default function TickerPanel(){
  const [ticker, setTicker] = useState<any>(null)
  const [symbol, setSymbol] = useState('BTC/USDT')

  useEffect(() => {
    authenticatedFetch('/api/ticker?exchange=binance&symbol=BTC/USDT').then(r=>r.json()).then(j=>{
      if (j.ok) setTicker(j.data)
    }).catch(console.error)

    socket.on('ticker', (data:any) => setTicker(data))
    return ()=>{ socket.disconnect() }
  }, [])

  return (
    <div className="card interactive-element">
      {!ticker ? <CyberpunkLoader message="Listening to Orderbook..." /> :
      <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <h3 style={{margin: 0}}>Tactical Market Overview</h3>
        <div className="small-muted" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>Live Sync</div>
      </div>

      <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
        <div>
          <div style={{fontSize: '0.8rem', color: '#888', textTransform: 'uppercase'}}>Asset</div>
          <div style={{fontSize: 24, fontWeight: 'bold'}}>{symbol} <span style={{fontSize: '1rem', color: '#888'}}>(Binance)</span></div>
        </div>

        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: '0.8rem', color: '#888', textTransform: 'uppercase'}}>Last Price</div>
          <div style={{fontSize: 28, fontWeight: 'bold', color: ticker.last > ticker.open ? '#10b981' : '#ef4444', textShadow: `0 0 10px ${ticker.last > ticker.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`}}>
            ${ticker.last ?? ticker.close ?? '—'}
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem'}}>
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', borderLeft: '3px solid #10b981'}}>
          <small style={{display: 'block', color: '#888', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem'}}>Highest Bid</small>
          <div style={{fontWeight: 'bold', fontFamily: 'monospace'}}>{ticker.bid ?? '—'}</div>
        </div>
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', borderLeft: '3px solid #ef4444'}}>
          <small style={{display: 'block', color: '#888', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem'}}>Lowest Ask</small>
          <div style={{fontWeight: 'bold', fontFamily: 'monospace'}}>{ticker.ask ?? '—'}</div>
        </div>
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6'}}>
          <small style={{display: 'block', color: '#888', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem'}}>24h Volume</small>
          <div style={{fontWeight: 'bold', fontFamily: 'monospace'}}>{ticker.baseVolume ? ticker.baseVolume.toFixed(2) : '—'}</div>
        </div>
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', borderLeft: '3px solid #8b5cf6'}}>
          <small style={{display: 'block', color: '#888', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem'}}>24h Change</small>
          <div style={{fontWeight: 'bold', fontFamily: 'monospace', color: ticker.percentage > 0 ? '#10b981' : '#ef4444'}}>
            {ticker.percentage ? `${ticker.percentage > 0 ? '+' : ''}${ticker.percentage.toFixed(2)}%` : '—'}
          </div>
        </div>
      </div>

      <div style={{marginTop: '1.5rem'}}>
        <h4 style={{marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textTransform: 'uppercase', fontSize: '0.8rem'}}>
          <div style={{width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981'}}></div>
          Holographic Order Flow Terrain
        </h4>
        <HoloOrderFlow price={ticker.last || ticker.close || 0} symbol={symbol} />
      </div>

      <details style={{marginTop: '1.5rem'}}>
        <summary style={{cursor: 'pointer', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.9rem'}}>Raw Ticker Data</summary>
        <pre style={{background:'#000',padding:8,borderRadius:6, fontSize: '0.8rem', overflowX: 'auto', marginTop: '0.5rem', border: '1px solid rgba(255,255,255,0.1)'}}>
          {JSON.stringify(ticker, null, 2)}
        </pre>
      </details>
      </>
      }
    </div>
  )
}
