import { useState, useEffect } from 'react';

interface AvatarAPI {
  playAction: (action: string) => void;
  setEmotion: (emotion: string, intensity?: number) => void;
  setViewMode: (mode: string) => void;
  lookAtCamera: () => void;
  reset: () => void;
  getStatus: () => any;
  executeCommand: (command: any) => void;
}

declare global {
  interface Window {
    avatarAPI?: AvatarAPI;
  }
}

const AVAILABLE_ACTIONS = [
  { id: 'wave', label: '👋 Wave', emoji: '👋' },
  { id: 'point', label: '👉 Point', emoji: '👉' },
  { id: 'nod', label: '👍 Nod', emoji: '👍' },
  { id: 'shake_head', label: '👎 Shake Head', emoji: '👎' },
  { id: 'bow', label: '🙇 Bow', emoji: '🙇' },
  { id: 'thumbs_up', label: '👍 Thumbs Up', emoji: '👍' },
  { id: 'dance', label: '💃 Dance', emoji: '💃' },
  { id: 'jump', label: '🦘 Jump', emoji: '🦘' },
  { id: 'celebrate', label: '🎉 Celebrate', emoji: '🎉' },
  { id: 'think', label: '🤔 Think', emoji: '🤔' },
  { id: 'shrug', label: '🤷 Shrug', emoji: '🤷' },
];

const AVAILABLE_EMOTIONS = [
  { id: 'neutral', label: '😐 Neutral', color: '#94a3b8' },
  { id: 'happy', label: '😊 Happy', color: '#fbbf24' },
  { id: 'sad', label: '😢 Sad', color: '#60a5fa' },
  { id: 'angry', label: '😠 Angry', color: '#f87171' },
  { id: 'cute', label: '🥰 Cute', color: '#f472b6' },
  { id: 'excited', label: '🤩 Excited', color: '#a78bfa' },
  { id: 'nervous', label: '😰 Nervous', color: '#fde047' },
  { id: 'surprised', label: '😲 Surprised', color: '#34d399' },
  { id: 'confused', label: '😕 Confused', color: '#fb923c' },
];

const VIEW_MODES = [
  { id: 'full-body', label: '🧍 Full Body' },
  { id: 'half-body', label: '🙋 Half Body' },
  { id: 'head-only', label: '🗣️ Head Only' },
  { id: 'cinematic', label: '🎬 Cinematic' },
];

export default function ControlPanel() {
  const [status, setStatus] = useState<any>(null);
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.avatarAPI) {
        const currentStatus = window.avatarAPI.getStatus();
        setStatus(currentStatus);
        if (currentStatus.currentEmotion) {
          setSelectedEmotion(currentStatus.currentEmotion);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePlayAction = (action: string) => {
    if (window.avatarAPI) {
      window.avatarAPI.playAction(action);
    }
  };

  const handleSetEmotion = (emotion: string) => {
    setSelectedEmotion(emotion);
    if (window.avatarAPI) {
      window.avatarAPI.setEmotion(emotion, emotionIntensity);
    }
  };

  const handleSetViewMode = (mode: string) => {
    if (window.avatarAPI) {
      window.avatarAPI.setViewMode(mode);
    }
  };

  const handleLookAtCamera = () => {
    if (window.avatarAPI) {
      window.avatarAPI.lookAtCamera();
    }
  };

  const handleReset = () => {
    if (window.avatarAPI) {
      window.avatarAPI.reset();
      setSelectedEmotion('neutral');
      setEmotionIntensity(0.8);
    }
  };

  if (!window.avatarAPI) {
    return (
      <div style={styles.panel}>
        <h3 style={styles.title}>🎭 Avatar Control Panel</h3>
        <p style={styles.loading}>Waiting for avatar to load...</p>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>🎭 Procedural Avatar Control</h3>

      {/* Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>📊 Status</h4>
        {status && (
          <div style={styles.info}>
            <div>Action: <strong>{status.currentAction || 'None'}</strong></div>
            <div>Emotion: <strong>{status.currentEmotion || 'neutral'}</strong></div>
            <div>View: <strong>{status.currentViewMode || 'full-body'}</strong></div>
            <div>Active: <strong>{status.activeAnimations?.length || 0}</strong> animations</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>🎬 Actions & Gestures</h4>
        <div style={styles.buttonGrid}>
          {AVAILABLE_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handlePlayAction(action.id)}
              style={{
                ...styles.button,
                ...(status?.currentAction === action.id ? styles.buttonActive : {})
              }}
              title={action.label}
            >
              {action.emoji} {action.id.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Emotions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>😊 Emotions</h4>
        <div style={styles.buttonGrid}>
          {AVAILABLE_EMOTIONS.map(emotion => (
            <button
              key={emotion.id}
              onClick={() => handleSetEmotion(emotion.id)}
              style={{
                ...styles.emotionButton,
                backgroundColor: selectedEmotion === emotion.id ? emotion.color : '#2d3748',
                borderColor: emotion.color,
              }}
              title={emotion.label}
            >
              {emotion.label}
            </button>
          ))}
        </div>
        <div style={styles.sliderContainer}>
          <label style={styles.sliderLabel}>Intensity: {(emotionIntensity * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={emotionIntensity}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setEmotionIntensity(value);
              if (window.avatarAPI) {
                window.avatarAPI.setEmotion(selectedEmotion, value);
              }
            }}
            style={styles.slider}
          />
        </div>
      </div>

      {/* View Modes */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>📷 Camera Views</h4>
        <div style={styles.buttonGrid}>
          {VIEW_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleSetViewMode(mode.id)}
              style={{
                ...styles.button,
                ...(status?.currentViewMode === mode.id ? styles.buttonActive : {})
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>⚡ Quick Actions</h4>
        <div style={styles.buttonRow}>
          <button onClick={handleLookAtCamera} style={styles.buttonSecondary}>
            👁️ Look at Camera
          </button>
          <button onClick={handleReset} style={styles.buttonDanger}>
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={styles.section}>
        <div style={styles.infoText}>
          ✨ <strong>Procedural Animation System</strong><br />
          No FBX files required! All animations are generated in real-time using code.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: 20,
    right: 20,
    width: 320,
    maxHeight: 'calc(100vh - 40px)',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#a78bfa',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid #2d3748',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  info: {
    fontSize: 12,
    lineHeight: '1.8',
    color: '#94a3b8',
  },
  loading: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
  },
  button: {
    padding: '8px 12px',
    backgroundColor: '#2d3748',
    border: '1px solid #4a5568',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  emotionButton: {
    padding: '8px 12px',
    border: '2px solid',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  buttonActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#c4b5fd',
    fontWeight: '600',
  },
  buttonPrimary: {
    padding: '10px 16px',
    backgroundColor: '#a78bfa',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: '600',
    width: '100%',
    transition: 'all 0.2s',
  },
  buttonSecondary: {
    padding: '8px 12px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    transition: 'all 0.2s',
  },
  buttonDanger: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    transition: 'all 0.2s',
  },
  sliderContainer: {
    marginTop: 12,
  },
  sliderLabel: {
    display: 'block',
    marginBottom: 8,
    fontSize: 12,
    color: '#cbd5e1',
  },
  slider: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    outline: 'none',
    background: '#4a5568',
  },
  infoText: {
    fontSize: 11,
    lineHeight: '1.6',
    color: '#94a3b8',
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 6,
  },
};
