import { authenticatedFetch } from "../auth"
import React, { useEffect, useState } from 'react';
import OrbitalPortfolio from './features/OrbitalPortfolio'
import socket from '../socket'
import AssetUniverse from './features/AssetUniverse'

export default function PortfolioPanel() {
  const [glitchKey, setGlitchKey] = useState(0);
  const [details, setDetails] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d')

  useEffect(() => {
    authenticatedFetch('/api/portfolio?exchanges=binance').then(r=>r.json()).then(j=>{
      if (j.ok && j.data) {
        setDetails(j.data.details || [])
        setTotal(j.data.total_usd || 0)
      }
    }).catch(console.error)


    socket.on('portfolio', (data:any) => {
      if (data) {
        setTotal(data.total_usd || 0)
        setDetails(data.details || [])
      }
    })
    return ()=>{ socket.disconnect() }
  }, [])

  return (
    <div className="card interactive-element">
      {!data ? <CyberpunkLoader message="Syncing Assets..." /> :
      <>

      {!data ? <CyberpunkLoader message="Syncing Assets..." /> :
      <>

      {!data ? <CyberpunkLoader message="Syncing Assets..." /> :
      <>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <h3 style={{margin: 0}}>Asset Universe</h3>
        <div style={{display:'flex', gap: '0.5rem'}}>
          <button
            onClick={() => setViewMode('3d')}
            className="btn-outline"
            style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: viewMode === '3d' ? 1 : 0.5}}
          >
            3D HUD
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="btn-outline"
            style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: viewMode === 'list' ? 1 : 0.5}}
          >
            LIST
          </button>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <div style={{fontSize:28,fontWeight:900, color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.4)'}}>
          ${total ? total.toFixed(2) : '—'}
        </div>
        <div className="small-muted" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>Live Sync</div>
      </div>

      {viewMode === '3d' ? (
        <AssetUniverse portfolio={details} totalValue={total} />
      ) : (
        <div style={{maxHeight: '400px', overflowY: 'auto'}}>
          <table className="table" style={{width: '100%'}}>
            <thead>
              <tr style={{textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <th style={{padding: '8px'}}>Asset</th>
                <th style={{padding: '8px'}}>Amount</th>
                <th style={{padding: '8px'}}>Value (USD)</th>
                <th style={{padding: '8px'}}>%</th>
              </tr>
            </thead>
            <tbody>
              {details.sort((a,b)=>(b.value_usd||0)-(a.value_usd||0)).map((d,i)=>(
                <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding: '8px', fontWeight: 'bold'}}>{d.asset}</td>
                  <td style={{padding: '8px', fontFamily: 'monospace'}}>{Number(d.amount).toFixed(6)}</td>
                  <td style={{padding: '8px', color: '#10b981'}}>${d.value_usd ? d.value_usd.toFixed(2) : '—'}</td>
                  <td style={{padding: '8px', opacity: 0.7}}>{total ? ((d.value_usd / total) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
          </>
      }
          </>
      }
          </>
      }
    </div>
  )
}
