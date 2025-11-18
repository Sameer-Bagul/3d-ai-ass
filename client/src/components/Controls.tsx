import { useState, useEffect } from 'react';
import AvatarController from './AvatarController';
import ViewModeController, { ViewMode } from '../lib/viewModes';
import { EmotionType } from '../lib/emotionEngine';
import { webSpeechTTS, isSupported, getAvailableVoices } from '../lib/webSpeechTTS';

interface ControlsProps {
  avatarController: AvatarController | null;
  viewModeController: ViewModeController | null;
  onDebugUpdate?: (info: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Controls({ avatarController, viewModeController, onDebugUpdate }: ControlsProps) {
  const [message, setMessage] = useState('Hello! How are you today?');
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>('full-body');

  useEffect(() => {
    const supported = isSupported();
    setTtsSupported(supported);
    
    if (supported) {
      setTimeout(() => {
        const voices = getAvailableVoices();
        setVoiceCount(voices.length);
        console.log('🎤 Web Speech API supported. Available voices:', voices.length);
      }, 100);
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = getAvailableVoices();
          setVoiceCount(voices.length);
        };
      }
    } else {
      console.error('❌ Web Speech API not supported in this browser');
      setStatus('Web Speech API not supported');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (avatarController) {
        setCurrentEmotion(avatarController.getCurrentEmotion());
        setCurrentAnimation(avatarController.getCurrentAnimation());
      }
      if (viewModeController) {
        setCurrentViewMode(viewModeController.getCurrentMode());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [avatarController, viewModeController]);

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

      if (data.animationPayload) {
        console.log('🎭 Applying animation payload:', data.animationPayload);
        await avatarController.applyAnimationPayload(data.animationPayload);
        
        if (data.animationPayload.viewMode && viewModeController) {
          viewModeController.setViewMode(data.animationPayload.viewMode, 1.0);
        }
      }

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
      }

    } catch (error) {
      console.error('❌ Chat error:', error);
      setStatus(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    if (!avatarController) return;
    
    avatarController.stopSpeaking();
    window.speechSynthesis.cancel();
    setStatus('Stopped');
    setIsProcessing(false);
  };

  const handleSetEmotion = (emotion: EmotionType) => {
    if (!avatarController) return;
    avatarController.setEmotion(emotion, 1.0);
    setStatus(`Emotion set to: ${emotion}`);
  };

  const handlePlayAnimation = async (animName: string) => {
    if (!avatarController) return;
    setStatus(`Playing: ${animName}`);
    await avatarController.playAnimation(animName, {
      interrupt: true,
      loop: false
    });
  };

  const handleSetViewMode = (mode: ViewMode) => {
    if (!viewModeController) return;
    viewModeController.setViewMode(mode, 1.0);
    setStatus(`View mode: ${mode}`);
  };

  const animations = avatarController?.getAvailableAnimations() || [];

  return (
    <div className="controls-panel">
      <h2>🎮 Avatar Controls</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isProcessing}
          rows={3}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button onClick={handleChat} disabled={isProcessing || !avatarController}>
          💬 Send Chat
        </button>
        <button onClick={handleStop} disabled={!isProcessing}>
          🛑 Stop
        </button>
      </div>

      <details style={{ marginBottom: '15px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>😊 Emotions</summary>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
          {(['happy', 'sad', 'angry', 'surprised', 'confused', 'neutral'] as EmotionType[]).map(emotion => (
            <button
              key={emotion}
              onClick={() => handleSetEmotion(emotion)}
              disabled={!avatarController}
              style={{ 
                fontSize: '11px',
                background: currentEmotion === emotion ? '#8b5cf6' : undefined
              }}
            >
              {emotion}
            </button>
          ))}
        </div>
      </details>

      <details style={{ marginBottom: '15px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🎬 Animations</summary>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '5px', 
          marginTop: '8px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {animations.map(anim => (
            <button
              key={anim}
              onClick={() => handlePlayAnimation(anim)}
              disabled={!avatarController}
              style={{ 
                fontSize: '10px',
                padding: '4px 6px',
                background: currentAnimation === anim ? '#8b5cf6' : undefined
              }}
            >
              {anim.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </details>

      <details style={{ marginBottom: '15px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📷 View Modes</summary>
        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
          {(['full-body', 'half-body', 'head-only'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleSetViewMode(mode)}
              disabled={!viewModeController}
              style={{ 
                fontSize: '11px',
                background: currentViewMode === mode ? '#8b5cf6' : undefined
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </details>

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
        <div>TTS: {ttsSupported ? `✅ (${voiceCount} voices)` : '❌'}</div>
        <div>Emotion: {currentEmotion}</div>
        <div>Animation: {currentAnimation || 'idle'}</div>
        <div>View: {currentViewMode}</div>
      </div>
    </div>
  );
}
