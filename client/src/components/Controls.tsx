import React, { useState, useRef } from 'react';
import AvatarController from './AvatarController';
import { playAudio, stopAudio } from '../lib/audioPlayer';

interface ControlsProps {
  avatarController: AvatarController | null;
  onDebugUpdate?: (info: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Controls({ avatarController, onDebugUpdate }: ControlsProps) {
  const [message, setMessage] = useState('Hello! How are you today?');
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChat = async () => {
    if (!avatarController || !message.trim()) {
      setStatus('Please enter a message');
      return;
    }

    setIsProcessing(true);
    setStatus('Sending message...');

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user1',
          message: message,
          options: { style: 'casual' }
        })
      });

      const data = await response.json();
      
      setStatus(`Reply: ${data.reply}`);
      console.log('💬 Chat response:', data);

      if (data.animationPlan) {
        onDebugUpdate?.({ status: 'Animation plan received' });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setStatus('Error: Could not connect to server');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTTS = async () => {
    if (!avatarController || !message.trim()) {
      setStatus('Please enter text for TTS');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating speech...');

    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          voice: 'default',
          format: 'wav'
        })
      });

      const data = await response.json();
      
      console.log('🔊 TTS response:', data);
      
      if (data.phonemes && data.phonemes.length > 0) {
        avatarController.applyPhonemeTimeline(data.phonemes);
        
        setStatus(`Playing ${data.phonemes.length} phonemes`);
        onDebugUpdate?.({ 
          phonemesActive: true,
          status: `Animating with ${data.phonemes.length} phonemes`
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
      setStatus('Error: Could not generate speech');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestAnimation = () => {
    if (!avatarController) {
      setStatus('Avatar not ready');
      return;
    }

    const samplePhonemes = [
      { phoneme: 'HH', start: 0.0, end: 0.08 },
      { phoneme: 'AH', start: 0.08, end: 0.18 },
      { phoneme: 'L', start: 0.18, end: 0.25 },
      { phoneme: 'OW', start: 0.25, end: 0.40 },
      { phoneme: 'W', start: 0.50, end: 0.58 },
      { phoneme: 'ER', start: 0.58, end: 0.70 },
      { phoneme: 'L', start: 0.70, end: 0.78 },
      { phoneme: 'D', start: 0.78, end: 0.85 }
    ];

    avatarController.applyPhonemeTimeline(samplePhonemes);
    
    setStatus('Testing lip-sync animation');
    onDebugUpdate?.({ 
      phonemesActive: true,
      status: 'Test animation playing'
    });
  };

  return (
    <div className="controls-panel">
      <h2>🎮 Avatar Controls</h2>
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={isProcessing}
      />

      <button onClick={handleChat} disabled={isProcessing || !avatarController}>
        💬 Send Chat
      </button>

      <button onClick={handleTTS} disabled={isProcessing || !avatarController}>
        🔊 Generate TTS & Animate
      </button>

      <button onClick={handleTestAnimation} disabled={isProcessing || !avatarController}>
        🎭 Test Lip-Sync
      </button>

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ 
        marginTop: '10px', 
        fontSize: '11px',
        opacity: 0.7
      }}>
        Server: {API_URL}
      </div>
    </div>
  );
}
