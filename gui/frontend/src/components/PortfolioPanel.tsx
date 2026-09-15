import { authenticatedFetch } from "../auth"
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import OrbitalPortfolio from './features/OrbitalPortfolio'
import Tooltip from './Tooltip'
import socket from '../socket'
import AssetUniverse from './features/AssetUniverse'
import CyberpunkLoader from './CyberpunkLoader'


// Memoized table row component for list rendering performance
const PortfolioRow = React.memo(({ d, total }: { d: any, total: number }) => (
  <tr style={{borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.3s"}} className="table-row-hover">
    <td style={{padding: '8px', fontWeight: 'bold'}}>{d.asset}</td>
    <td style={{padding: '8px', fontFamily: 'monospace'}}>{Number(d.amount).toFixed(6)}</td>
    <td style={{padding: '8px', color: '#10b981'}}>${d.value_usd ? d.value_usd.toFixed(2) : '—'}</td>
    <td style={{padding: '8px', opacity: 0.7}}>{total ? ((d.value_usd / total) * 100).toFixed(1) : 0}%</td>
  </tr>
));

export default function PortfolioPanel() {
  const [details, setDetails] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d')
  const [dataLoaded, setDataLoaded] = useState(false);

  // Optimization: Memoize the sorted details to prevent O(N log N) sorting on every render
  // and prevent in-place mutation of the details state array.
  const sortedDetails = useMemo(() => {
    return [...details].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
  }, [details]);

  useEffect(() => {
    let active = true;
    authenticatedFetch('/api/portfolio?exchanges=binance').then(r=>r.json()).then(j=>{
      if (j.ok && j.data && active) {
        setDetails(j.data.details || [])
        setTotal(j.data.total_usd || 0)
        setDataLoaded(true);
      }
    }).catch(console.error)

    const handlePortfolio = (data:any) => {
      if (data) {
        setTotal(data.total_usd || 0)
        setDetails(data.details || [])
        setDataLoaded(true);
      }
    };

    socket.on('portfolio', handlePortfolio)
    return () => {
      active = false;
      socket.off('portfolio', handlePortfolio);
    }
  }, [])

  return (
    <div className="card interactive-element">
      {!dataLoaded ? <CyberpunkLoader message="Syncing Assets..." /> :
      <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <h3 style={{margin: 0}} className="glitch" data-text="Asset Universe">Asset Universe</h3>
        <div style={{display:'flex', gap: '0.5rem'}}>
          <Tooltip text="View Asset Universe in 3D HUD">
            <button
              onClick={() => setViewMode('3d')}
              aria-label="View Asset Universe in 3D HUD"
              aria-pressed={viewMode === '3d'}
              className="btn-outline"
              style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: viewMode === '3d' ? 1 : 0.5}}
            >
              3D HUD
            </button>
          </Tooltip>
          <Tooltip text="View Asset Universe as List">
            <button
              onClick={() => setViewMode('list')}
              aria-label="View Asset Universe as List"
              aria-pressed={viewMode === 'list'}
              className="btn-outline"
              style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: viewMode === 'list' ? 1 : 0.5}}
            >
              LIST
            </button>
          </Tooltip>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '1rem'}}>
        <div style={{fontSize:28,fontWeight:900, color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.4)'}}>
          ${total ? total.toFixed(2) : '—'}
        </div>
        <div className="small-muted status-indicator-live" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>Live Sync</div>
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
              {sortedDetails.map((d,i)=>(
                <PortfolioRow key={i} d={d} total={total} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      }
    </div>
  )
}
