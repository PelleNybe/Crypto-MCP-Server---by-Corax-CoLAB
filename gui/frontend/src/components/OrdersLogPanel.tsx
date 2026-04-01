import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { authenticatedFetch } from '../auth';

export default function OrdersLogPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

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

    socket.on('order_placed', (o) => {
      setOrders(prev => [o, ...prev]);
    });
    socket.on('order_pending', (o) => {
      setOrders(prev => [o, ...prev]);
    });

    return () => {
      active = false;
      socket.off('order_placed');
      socket.off('order_pending');
    };
  }, []);

  const totalPages = Math.ceil(orders.length / rowsPerPage) || 1;
  const currentOrders = orders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const approveOrder = async (orderId: number) => {
    try {
      const res = await authenticatedFetch('/api/order/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'placed', response: JSON.stringify(data.data) } : o));
      } else {
        alert('Approve failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Approve Error: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return { color: '#10b981', textShadow: '0 0 5px #10b981' };
      case 'pending': return { color: '#f59e0b', textShadow: '0 0 5px #f59e0b' };
      case 'error': return { color: '#ef4444', textShadow: '0 0 5px #ef4444' };
      default: return { color: '#94a3b8' };
    }
  };

  return (
    <div className="card interactive-element" style={{ overflowX: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', textTransform: 'uppercase' }}>
         Log Archive
      </h2>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
            <th style={{ padding: '10px' }}>Date</th>
            <th style={{ padding: '10px' }}>Pair</th>
            <th style={{ padding: '10px' }}>Side/Type</th>
            <th style={{ padding: '10px' }}>Amount</th>
            <th style={{ padding: '10px' }}>Status</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((o: any, idx) => (
            <tr key={o.id || idx} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.3s' }} className="table-row-hover">
              <td style={{ padding: '10px', fontSize: '12px' }}>{new Date(o.created_at || Date.now()).toLocaleString()}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{o.symbol}</td>
              <td style={{ padding: '10px', textTransform: 'uppercase' }}>
                <span style={{ color: o.side === 'buy' ? '#10b981' : '#ef4444' }}>{o.side}</span> / {o.type}
              </td>
              <td style={{ padding: '10px' }}>{o.amount} @ {o.price || 'Market'}</td>
              <td style={{ padding: '10px', textTransform: 'uppercase', ...getStatusColor(o.status) }}>
                {o.status}
              </td>
              <td style={{ padding: '10px' }}>
                {o.status === 'pending' && (
                  <button onClick={() => approveOrder(o.id)} aria-label={`Approve order ${o.id || idx}`} className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px' }}>
                    APPROVE
                  </button>
                )}
              </td>
            </tr>
          ))}
          {currentOrders.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {orders.length > rowsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline" style={{ padding: '5px 10px' }}>
            Prev
          </button>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', fontFamily: 'monospace' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline" style={{ padding: '5px 10px' }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
