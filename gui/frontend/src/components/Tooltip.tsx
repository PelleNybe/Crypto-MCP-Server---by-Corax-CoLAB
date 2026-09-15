import React, { useState } from 'react';

export const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}
         onFocus={() => setShow(true)}
         onBlur={() => setShow(false)}>
      {children}
      {show && (
        <div role="tooltip" style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #10b981', color: '#10b981',
          padding: '6px 10px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap',
          zIndex: 1000, marginTop: '8px', fontFamily: 'monospace', textTransform: 'uppercase',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)', pointerEvents: 'none',
          animation: 'fade-in-up 0.2s ease-out'
        }}>
          {text}
        </div>
      )}
    </div>
  );
};
export default Tooltip;
