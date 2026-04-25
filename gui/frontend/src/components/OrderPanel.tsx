import NeuralTradeVisualizer from './features/NeuralTradeVisualizer'
import { authenticatedFetch } from "../auth"
import React, { useState } from 'react'
import { useToast } from './NeonToasts'

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

  async function previewOrder(){
    setRoutingActive(true)
    const resp = await authenticatedFetch('/api/order/dry_run', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({exchange,symbol,side,type,amount,price})})
    const j = await resp.json()
    if (j.ok) setPreview(j.data); else addToast(j.error, 'info')
    setTimeout(() => setRoutingActive(false), 2000)
  }

  async function placeOrder(){
    if (!confirm('Place live order?')) return
    setRoutingActive(true)
    const resp = await authenticatedFetch('/api/order/execute', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({exchange,symbol,side,type,amount,price,execute:true})})
    const j = await resp.json()
    if (j.ok) { setResult(j.data); addToast('Order placed') } else alert(j.error, 'info')
    setTimeout(() => setRoutingActive(false), 2000)
  }

  return (
    <div className="card interactive-element">
      <h3>Order / Trade</h3>
      <div style={{display:'grid',gap:8}}>
        <input aria-label="Enter Exchange Name" value={exchange} onChange={e=>setExchange(e.target.value)} />
        <input aria-label="Enter Trading Symbol" value={symbol} onChange={e=>setSymbol(e.target.value)} />
        <div style={{display:'flex',gap:8}}>
          <select aria-label="Order Side" value={side} onChange={e=>setSide(e.target.value)}><option>buy</option><option>sell</option></select>
          <select aria-label="Order Type" value={type} onChange={e=>setType(e.target.value)}><option>market</option><option>limit</option></select>
        </div>
        <input aria-label="Enter Trade Amount" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        {type==='limit' && <input aria-label="Enter Limit Price" type="number" value={price ?? ''} onChange={e=>setPrice(Number(e.target.value))} />}
        <div style={{display:'flex',gap:8}}>
          <button className="btn-primary" onClick={previewOrder} disabled={routingActive}>{routingActive ? "Routing..." : "Preview"}</button>
          <button onClick={placeOrder} disabled={routingActive}>{routingActive ? "Placing..." : "Place"}</button>
        </div>
        {preview && <pre style={{background:'#334155',padding:8, overflowX: 'auto'}}>{JSON.stringify(preview,null,2)}</pre>}
        {result && <pre style={{background:'#064e3b',padding:8, overflowX: 'auto'}}>{JSON.stringify(result,null,2)}</pre>}
      </div>
      {/* Neural Trade Visualizer Overlay Component */}
      <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Smart Routing Diagnostics</h4>
          <NeuralTradeVisualizer active={routingActive} exchange={exchange} symbol={symbol} />
      </div>
    </div>
  )
}
