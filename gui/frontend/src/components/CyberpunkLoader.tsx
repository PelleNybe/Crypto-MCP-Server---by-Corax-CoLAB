import React from 'react';
import { Loader } from 'lucide-react';

export const CyberpunkLoader = ({ message = "Decrypting Data Stream..." }) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Loading"
    style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#10b981',
    fontFamily: 'monospace',
    animation: 'pulse 2s infinite'
  }}>
    <Loader size={32} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} />
    <span style={{ marginTop: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
      {message}
    </span>
  </div>
);

export default CyberpunkLoader;
