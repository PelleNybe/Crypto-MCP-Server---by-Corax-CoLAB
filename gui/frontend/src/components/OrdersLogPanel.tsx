import React, { useState, useEffect, useCallback } from 'react';
import socket from '../socket';
import { authenticatedFetch } from '../auth';
import TypewriterText from './TypewriterText';
import Tooltip from './Tooltip';
import { useToast } from '../hooks/useToast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'placed': return { color: '#10b981', textShadow: '0 0 5px rgba(16, 185, 129, 0.5)' };
    case 'pending': return { color: '#f59e0b', textShadow: '0 0 5px rgba(245, 158, 11, 0.5)' };
    case 'error': return { color: '#ef4444', textShadow: '0 0 5px rgba(239, 68, 68, 0.5)' };
    default: return { color: '#94a3b8' };
  }
};

// Memoized table row component for performance
const OrderRow = React.memo(({ o, idx, approveOrder }: { o: any, idx: number, approveOrder: (id: number) => void }) => {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }} className="table-row-hover">
      <td style={{ padding: '12px 10px', fontSize: '12px', color: '#cbd5e1' }}>{new Date(o.created_at || new Date()).toLocaleString()}</td>
      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#f8fafc' }}>{o.symbol}</td>
      <td style={{ padding: '12px 10px', textTransform: 'uppercase' }}>
        <span style={{ color: o.side === 'buy' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{o.side}</span> / <span style={{ color: '#94a3b8' }}>{o.type}</span>
      </td>
      <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{o.amount} <span style={{color: '#64748b'}}>@</span> {o.price || 'Market'}</td>
      <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 'bold', ...getStatusColor(o.status) }}>
        {o.status}
      </td>
      <td style={{ padding: '12px 10px' }}>
        {o.status === 'pending' && (
          <Tooltip text="Manually approve this pending autonomous trade">
            <button onClick={() => approveOrder(o.id)} aria-label={`Approve order ${o.id || idx}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '10px', letterSpacing: '1px' }}>
              APPROVE
            </button>
          </Tooltip>
        )}
      </td>
    </tr>
  );
});

export default function OrdersLogPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      try {
        const res = await authenticatedFetch('/api/orders');
        const data = await res.json();
        if (data.ok && active) setOrders(data.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      }
    };
    fetchOrders();

    const handleOrderPlaced = (o: any) => {
      setOrders(prev => [o, ...prev]);
      // Optimization: Pre-calculate toUpperCase to prevent redundant operations
      const sideUpper = o.side ? o.side.toUpperCase() : 'UNKNOWN';
      addToast(`Order placed: ${sideUpper} ${o.amount} ${o.symbol}`, 'success');
    };
    const handleOrderPending = (o: any) => {
      setOrders(prev => [o, ...prev]);
      // Optimization: Pre-calculate toUpperCase to prevent redundant operations
      const sideUpper = o.side ? o.side.toUpperCase() : 'UNKNOWN';
      addToast(`Order pending approval: ${sideUpper} ${o.amount} ${o.symbol}`, 'warning');
    };

    socket.on('order_placed', handleOrderPlaced);
    socket.on('order_pending', handleOrderPending);

    return () => {
      active = false;
      socket.off('order_placed', handleOrderPlaced);
      socket.off('order_pending', handleOrderPending);
    };
  }, [addToast]);

  const totalPages = React.useMemo(() => Math.ceil(orders.length / rowsPerPage) || 1, [orders.length, rowsPerPage]);
  const currentOrders = React.useMemo(() => orders.slice((page - 1) * rowsPerPage, page * rowsPerPage), [orders, page, rowsPerPage]);

  const approveOrder = useCallback(async (orderId: number) => {
    try {
      const res = await authenticatedFetch('/api/order/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'placed', response: JSON.stringify(data.data) } : o));
        addToast('Order successfully approved', 'success');
      } else {
        addToast('Approve failed: ' + data.error, 'error');
      }
    } catch (err: any) {
      addToast('Approve Error: ' + err.message, 'error');
    }
  }, [addToast]);

  return (
    <div className="card interactive-element glass-panel" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 className="glitch" data-text="Execution Archive" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', textTransform: 'uppercase', margin: 0 }}>
             Execution Archive
          </h2>
          <div className="status-indicator-live" style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 10px #3b82f6' }} title="Socket Connected"></div>
      </div>

      <div style={{ flexGrow: 1, minHeight: '300px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>
                <th style={{ padding: '10px' }}>Timestamp</th>
                <th style={{ padding: '10px' }}>Vector</th>
                <th style={{ padding: '10px' }}>Directive</th>
                <th style={{ padding: '10px' }}>Quantity</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Auth</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((o: any, idx) => (
                <OrderRow key={o.id || idx} o={o} idx={idx} approveOrder={approveOrder} />
              ))}
              {currentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.5 }}>∅</div>
                      <TypewriterText text="No execution records found in current timeline." speed={30} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      {orders.length > rowsPerPage && (
        <nav aria-label="Orders log pagination" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Tooltip text={page === 1 ? "Already on the first page" : "Go to previous page"}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="btn-outline" style={{ padding: '6px 15px', fontSize: '12px' }}>
                &larr; PREV
              </button>
          </Tooltip>

          <span aria-live="polite" aria-atomic="true" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '0 15px', borderRadius: '4px' }}>
            PAGE <span style={{ color: '#fff', margin: '0 5px' }}>{page}</span> OF <span style={{ color: '#fff', margin: '0 5px' }}>{totalPages}</span>
          </span>

          <Tooltip text={page === totalPages ? "Already on the last page" : "Go to next page"}>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="btn-outline" style={{ padding: '6px 15px', fontSize: '12px' }}>
                NEXT &rarr;
              </button>
          </Tooltip>
        </nav>
      )}
    </div>
  );
}
