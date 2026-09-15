import { useCallback } from "react"
import NeuralTradeVisualizer from './features/NeuralTradeVisualizer'
import { authenticatedFetch } from "../auth"
import React, { useState, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import Tooltip from "./Tooltip";

export default function OrderPanel(){
  const [exchange,setExchange]=useState('binance')
  const [symbol,setSymbol]=useState('BTC/USDT')
  const [side,setSide]=useState('buy')
  const [type,setType]=useState('market')
  const [amount,setAmount]=useState<number>(0.001)
  const [price,setPrice]=useState<number|null>(null)
  const [preview,setPreview]=useState<any>(null)
  const [result,setResult]=useState<any>(null)
  const [routingActive, setRoutingActive] = useState(false)
  const { addToast } = useToast()

  const debouncedExchange = useDebounce(exchange, 500);
  const debouncedSymbol = useDebounce(symbol, 500);
  const debouncedSide = useDebounce(side, 500);
  const debouncedType = useDebounce(type, 500);
  const debouncedAmount = useDebounce(amount, 500);
  const debouncedPrice = useDebounce(price, 500);

  const previewOrderDebounced = useCallback(async () => {
    setRoutingActive(true)
    const resp = await authenticatedFetch('/api/order/dry_run', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({exchange: debouncedExchange,symbol: debouncedSymbol,side: debouncedSide,type: debouncedType,amount: debouncedAmount,price: debouncedPrice})})
    const j = await resp.json()
    if (j.ok) setPreview(j.data); // Suppress errors for auto-preview
    setTimeout(() => setRoutingActive(false), 500)
  }, [debouncedExchange, debouncedSymbol, debouncedSide, debouncedType, debouncedAmount, debouncedPrice]);

  useEffect(() => {
    if (debouncedExchange && debouncedSymbol && debouncedAmount > 0) {
      const timeoutId = setTimeout(() => {
        previewOrderDebounced();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [debouncedExchange, debouncedSymbol, debouncedSide, debouncedType, debouncedAmount, debouncedPrice, previewOrderDebounced]);

  const previewOrder = useCallback(async () => {
    setRoutingActive(true)
    const resp = await authenticatedFetch('/api/order/dry_run', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({exchange,symbol,side,type,amount,price})})
    const j = await resp.json()
    if (j.ok) setPreview(j.data); else addToast(j.error, 'error')
    setTimeout(() => setRoutingActive(false), 2000)
  }, [exchange, symbol, side, type, amount, price, addToast]);

  const placeOrder = useCallback(async () => {
    if (!confirm('Place live order?')) return
    setRoutingActive(true)
    const resp = await authenticatedFetch('/api/order/execute', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({exchange,symbol,side,type,amount,price,execute:true})})
    const j = await resp.json()
    if (j.ok) { setResult(j.data); addToast('Order placed', 'success') } else addToast(j.error, 'error')
    setTimeout(() => setRoutingActive(false), 2000)
  }, [exchange, symbol, side, type, amount, price, addToast]);

  return (
    <div className="card interactive-element glass-panel">
      <h3 className="glitch" data-text="Terminal Order Execution">Terminal Order Execution</h3>
      <div style={{display:'grid',gap:12}}>

        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label htmlFor="exchangeInput" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Exchange Node</label>
          <input id="exchangeInput" title="Exchange (e.g. binance)" aria-label="Enter Exchange Name" placeholder="Exchange (e.g. binance)" value={exchange} onChange={e=>setExchange(e.target.value)} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: '#10b981', outline: 'none', borderRadius: '4px', fontFamily: 'monospace'}} />
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
           <label htmlFor="symbolInput" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Asset Target</label>
           <input id="symbolInput" title="Symbol (e.g. BTC/USDT)" aria-label="Enter Trading Symbol" placeholder="Symbol (e.g. BTC/USDT)" value={symbol} onChange={e=>setSymbol(e.target.value)} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: '#10b981', outline: 'none', borderRadius: '4px', fontFamily: 'monospace'}} />
        </div>

        <div style={{display:'flex',gap:12}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: 1}}>
             <label htmlFor="sideSelect" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Protocol Directive</label>
             <select id="sideSelect" title="Order Side" aria-label="Order Side" value={side} onChange={e=>setSide(e.target.value)} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: side === 'buy' ? '#10b981' : '#ef4444', outline: 'none', borderRadius: '4px', fontFamily: 'monospace', textTransform: 'uppercase'}}>
               <option value="buy">Initiate Buy</option>
               <option value="sell">Execute Sell</option>
             </select>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: 1}}>
             <label htmlFor="typeSelect" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Execution Type</label>
             <select id="typeSelect" title="Order Type" aria-label="Order Type" value={type} onChange={e=>setType(e.target.value)} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: '#60a5fa', outline: 'none', borderRadius: '4px', fontFamily: 'monospace', textTransform: 'uppercase'}}>
               <option value="market">Market</option>
               <option value="limit">Limit</option>
             </select>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
           <label htmlFor="amountInput" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Quantity Vector</label>
           <input id="amountInput" title="Amount" aria-label="Enter Trade Amount" placeholder="Amount" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: '#f8fafc', outline: 'none', borderRadius: '4px', fontFamily: 'monospace'}} />
        </div>

        {type==='limit' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
             <label htmlFor="priceInput" className="small-muted" style={{textTransform: 'uppercase', fontSize: '10px'}}>Target Limit</label>
             <input id="priceInput" title="Price" aria-label="Enter Limit Price" placeholder="Price" type="number" value={price ?? ''} onChange={e=>setPrice(Number(e.target.value))} style={{background: 'rgba(0,0,0,0.5)', border: '1px solid #334155', padding: '8px', color: '#f8fafc', outline: 'none', borderRadius: '4px', fontFamily: 'monospace'}} />
          </div>
        )}

        <div style={{display:'flex',gap:12, marginTop: '10px'}}>
          <Tooltip text="Calculate potential fees and exact amounts without placing real order">
             <button className="btn-outline" aria-label={routingActive ? "Routing order preview..." : "Force Order Preview"} onClick={previewOrder} disabled={routingActive} aria-busy={routingActive} aria-live="polite" style={{flex: 1, padding: '10px', fontSize: '12px'}}>{routingActive ? "Routing..." : "Force Preview"}</button>
          </Tooltip>
          <Tooltip text="Execute live market/limit order immediately">
             <button className={side === 'buy' ? "btn-primary" : "btn-danger"} onClick={placeOrder} aria-label={routingActive ? "Placing order..." : "Place Order"} disabled={routingActive} aria-busy={routingActive} aria-live="polite" style={{flex: 2, padding: '10px', fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold'}}>{routingActive ? "Placing..." : `Confirm ${side.toUpperCase()}`}</button>
          </Tooltip>
        </div>
        {preview && <pre style={{background:'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', padding:10, overflowX: 'auto', borderRadius: '4px', fontSize: '11px', color: '#94a3b8'}}>{JSON.stringify(preview,null,2)}</pre>}
        {result && <pre style={{background:'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding:10, overflowX: 'auto', borderRadius: '4px', fontSize: '11px', color: '#10b981'}}>{JSON.stringify(result,null,2)}</pre>}
      </div>
      {/* Neural Trade Visualizer Overlay Component */}
      <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div className={routingActive ? "status-indicator-live" : ""} style={{width: '6px', height: '6px', borderRadius: '50%', background: routingActive ? '#10b981' : '#334155'}}></div>
            Smart Routing Diagnostics
          </h4>
          <NeuralTradeVisualizer active={routingActive} exchange={exchange} symbol={symbol} />
      </div>
    </div>
  )
}
