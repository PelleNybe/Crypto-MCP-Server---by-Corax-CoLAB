import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Terminal, X, BrainCircuit } from 'lucide-react';
import { callMcpEndpoint } from '../../api_mcp';

export default function OracleCopilot() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{ id: number; text: string; type: 'user' | 'ai' | 'system' }[]>([]);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const processAICommand = async (command: string) => {
    setLogs(prev => [...prev, { id: Date.now(), text: "PROCESSING COMMAND...", type: 'system' }]);

    try {
      const response = await callMcpEndpoint('MCP_LLM', 'generate_text', {
        prompt: `As the Oracle AI of a trading dashboard, respond briefly and authoritatively to the following user command: ${command}`,
        max_tokens: 150
      });

      let aiText = "Neural connection degraded. Unable to compute response.";
      if (response && response.response) {
        aiText = response.response;
      }

      setLogs(prev => [...prev, { id: Date.now(), text: aiText, type: 'ai' }]);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Siri') || v.lang === 'en-GB');
        if (techVoice) utterance.voice = techVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("LLM MCP Error:", err);
      setLogs(prev => [...prev, { id: Date.now(), text: "ERROR: Failed to establish uplink with LLM MCP.", type: 'system' }]);
    }
  };

  useEffect(() => {
    // Add initial system boot log
    setTimeout(() => setLogs([{ id: Date.now(), text: 'ORACLE NEURAL LINK ESTABLISHED.', type: 'system' }]), 0);

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;

            // Process final command
            const command = event.results[i][0].transcript.trim();
            if (command) {
              setLogs(prev => [...prev, { id: Date.now(), text: command, type: 'user' }]);
              setTimeout(() => processAICommand(command), 0);
            }
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const processAICommand = async (command: string) => {
    setLogs(prev => [...prev, { id: Date.now(), text: "PROCESSING COMMAND...", type: 'system' }]);

    try {
      const response = await callMcpEndpoint('MCP_LLM', 'generate_text', {
        prompt: `As the Oracle AI of a trading dashboard, respond briefly and authoritatively to the following user command: ${command}`,
        max_tokens: 150
      });

      let aiText = "Neural connection degraded. Unable to compute response.";
      if (response && response.response) {
        aiText = response.response;
      }

      setLogs(prev => [...prev, { id: Date.now(), text: aiText, type: 'ai' }]);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Siri') || v.lang === 'en-GB');
        if (techVoice) utterance.voice = techVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("LLM MCP Error:", err);
      setLogs(prev => [...prev, { id: Date.now(), text: "ERROR: Failed to establish uplink with LLM MCP.", type: 'system' }]);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom of logs
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      if (!isOpen) setIsOpen(true);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setLogs(prev => [...prev, { id: Date.now(), text: 'LISTENING FOR COMMAND...', type: 'system' }]);
      } catch (e) {
        console.error("Microphone access denied or error starting.", e);
      }
    }
  };


  return (
    <>
      {/* The Floating Orb Trigger */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <div
          onClick={toggleListening}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isListening ? 'radial-gradient(circle, #10b981 0%, #064e3b 80%)' : 'radial-gradient(circle, #3b82f6 0%, #1e3a8a 80%)',
            boxShadow: isListening ? '0 0 30px #10b981, inset 0 0 15px rgba(255,255,255,0.5)' : '0 0 15px #3b82f6',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            animation: isListening ? 'pulse 1s infinite alternate' : 'float 3s infinite ease-in-out',
            border: `2px solid ${isListening ? '#34d399' : '#60a5fa'}`,
          }}
          title={isListening ? "Deactivate Oracle" : "Activate Oracle Co-Pilot"}
        >
          {isListening ? <Mic size={24} color="#fff" /> : <BrainCircuit size={28} color="#fff" />}
        </div>
        <div style={{
          fontSize: '10px',
          fontFamily: 'monospace',
          color: isListening ? '#10b981' : '#60a5fa',
          letterSpacing: '1px',
          textShadow: `0 0 5px ${isListening ? '#10b981' : '#60a5fa'}`
        }}>
          {isListening ? 'ORACLE ACTIVE' : 'CO-PILOT STNDBY'}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 20px #10b981, inset 0 0 10px rgba(255,255,255,0.5); }
          100% { transform: scale(1.05); box-shadow: 0 0 40px #10b981, inset 0 0 20px rgba(255,255,255,0.8); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* The AI Terminal Overlay */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '6rem',
          right: '2rem',
          width: '350px',
          height: '400px',
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.5) 0%, transparent 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="#60a5fa" />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 'bold' }}>ORACLE // LOG_STREAM</span>
            </div>
            <button
              aria-label="Close Oracle Log Stream"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Logs Container */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: '15px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {logs.map((log) => (
              <div key={log.id} style={{
                color: log.type === 'system' ? '#888' : log.type === 'user' ? '#fff' : '#10b981',
                paddingLeft: log.type === 'ai' ? '10px' : '0',
                borderLeft: log.type === 'ai' ? '2px solid #10b981' : 'none',
                opacity: 0.9
              }}>
                <span style={{ opacity: 0.5, marginRight: '8px' }}>
                  {log.type === 'user' ? 'USR&gt;' : log.type === 'ai' ? 'SYS&gt;' : '---'}
                </span>
                {log.text}
              </div>
            ))}
            {isListening && transcript && (
              <div style={{ color: '#fff', opacity: 0.5 }}>
                <span style={{ marginRight: '8px' }}>USR&gt;</span>
                {transcript}...
              </div>
            )}

            {/* Scanline effect over logs */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.1) 51%)',
              backgroundSize: '100% 4px',
              pointerEvents: 'none',
              opacity: 0.3
            }} />
          </div>
        </div>
      )}
    </>
  );
}
