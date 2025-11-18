import { useState, useEffect } from 'react';
import AvatarController from './AvatarController';
import { webSpeechTTS, isSupported, getAvailableVoices } from '../lib/webSpeechTTS';

interface ControlsProps {
  avatarController: AvatarController | null;
  onDebugUpdate?: (info: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Controls({ avatarController, onDebugUpdate }: ControlsProps) {
  const [message, setMessage] = useState('Hello! How are you today?');
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);

  useEffect(() => {
    const supported = isSupported();
    setTtsSupported(supported);
    
    if (supported) {
      setTimeout(() => {
        const voices = getAvailableVoices();
        setVoiceCount(voices.length);
        console.log('🎤 Web Speech API supported. Available voices:', voices.length);
        console.log('Voices:', voices.map(v => `${v.name} (${v.lang})`));
      }, 100);
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = getAvailableVoices();
          setVoiceCount(voices.length);
          console.log('🎤 Voices loaded:', voices.length);
        };
      }
    } else {
      console.error('❌ Web Speech API not supported in this browser');
      setStatus('Web Speech API not supported');
    }
  }, []);

  const handleChat = async () => {
    if (!avatarController || !message.trim()) {
      setStatus('Please enter a message');
      return;
    }

    setIsProcessing(true);
    setStatus('Sending message...');

    try {
      console.log(`📤 Sending chat to ${API_URL}/api/chat`);
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user1',
          message: message,
          options: { style: 'casual' }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setStatus(`Reply: ${data.reply}`);
      console.log('💬 Chat response:', data);

      if (data.tts && data.tts.useClientTTS) {
        console.log('🔊 Using Web Speech TTS for:', data.tts.text);
        
        if (data.tts.phonemes && data.tts.phonemes.length > 0) {
          avatarController.applyPhonemeTimeline(data.tts.phonemes);
          onDebugUpdate?.({ 
            phonemesActive: true,
            status: `Animating with ${data.tts.phonemes.length} phonemes`
          });
        }

        try {
          console.log('🗣️ Starting speech...');
          await webSpeechTTS.speak(data.tts.text, {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
          });
          console.log('✅ Speech completed');
          setStatus('Speech completed');
        } catch (error) {
          console.error('❌ Speech error:', error);
          setStatus(`Speech error: ${error}`);
        }
      } else {
        console.warn('⚠️ No TTS data in response');
      }

      if (data.animationPlan) {
        onDebugUpdate?.({ status: 'Animation plan received' });
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      setStatus(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTTS = async () => {
    if (!message.trim()) {
      setStatus('Please enter text for TTS');
      return;
    }

    if (!ttsSupported) {
      alert('Web Speech API not supported in this browser!');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating speech...');

    try {
      console.log('🎤 Starting direct TTS');
      console.log('📝 Text:', message);
      
      const phonemes = webSpeechTTS.generateEstimatedPhonemes(message);
      console.log('📊 Estimated phonemes:', phonemes.length);
      
      if (avatarController && phonemes && phonemes.length > 0) {
        avatarController.applyPhonemeTimeline(phonemes);
        onDebugUpdate?.({ 
          phonemesActive: true,
          status: `Animating with ${phonemes.length} phonemes`
        });
      }

      console.log('🗣️ Calling speak...');
      await webSpeechTTS.speak(message, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      
      console.log('✅ Speech completed');
      setStatus('Speech completed');
    } catch (error) {
      console.error('❌ TTS error:', error);
      setStatus(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimpleTest = () => {
    console.log('🧪 Simple TTS test');
    const utterance = new SpeechSynthesisUtterance('Testing one two three');
    utterance.onstart = () => console.log('▶️ Speech started');
    utterance.onend = () => console.log('⏹️ Speech ended');
    utterance.onerror = (e) => console.error('❌ Speech error:', e);
    window.speechSynthesis.speak(utterance);
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

      <button onClick={handleTTS} disabled={isProcessing || !ttsSupported}>
        🔊 Generate TTS & Animate
      </button>

      <button onClick={handleSimpleTest} disabled={!ttsSupported}>
        🧪 Simple TTS Test
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
        <div>Server: {API_URL}</div>
        <div>TTS: {ttsSupported ? `✅ Supported (${voiceCount} voices)` : '❌ Not Supported'}</div>
      </div>
    </div>
  );
}
