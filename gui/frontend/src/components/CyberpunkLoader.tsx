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
    fontFamily: 'var(--font-mono)',
  }}>
    <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '20px' }}>
       {/* Cyberpunk Scanner Effect */}
       <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid #10b981', borderRadius: '50%', opacity: 0.2 }}></div>
       <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'spin 2s linear infinite' }}></div>
       <Loader size={32} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 2s infinite' }} />
    </div>

    <span className="glitch-update" style={{ letterSpacing: '2px', textTransform: 'uppercase', textShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}>
      {message}
    </span>

    <div style={{ marginTop: '20px', width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton-box" style={{ width: '100%', height: '8px' }}></div>
      <div className="skeleton-box" style={{ width: '80%', height: '8px', margin: '0 auto' }}></div>
      <div className="skeleton-box" style={{ width: '60%', height: '8px', margin: '0 auto' }}></div>
    </div>
  </div>
);

export default CyberpunkLoader;
