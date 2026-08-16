import React, { useState, useEffect } from 'react';

const TypewriterText: React.FC<{ text: string, speed?: number }> = ({ text, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        setDisplayedText('');
        setIndex(0);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeoutId);
    }
  }, [index, text, speed]);

  return <span style={{ position: 'relative' }}>
    {displayedText}
    {index < text.length && <span style={{ borderRight: '2px solid #10b981', animation: 'blink 1s step-end infinite' }}></span>}
  </span>;
};

export default TypewriterText;
