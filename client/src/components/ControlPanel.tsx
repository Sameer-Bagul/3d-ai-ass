import { useState, useEffect } from 'react';

interface AvatarAPI {
  playAnimation: (name: string, options?: any) => any;
  loadAnimation: (name: string) => Promise<any>;
  loadAllAnimations: (onProgress?: (loaded: number, total: number) => void) => Promise<void>;
  stopAnimation: (fadeDuration?: number) => void;
  setEmotion: (emotion: string, intensity?: number) => void;
  setViewMode: (mode: string, animate?: boolean) => void;
  cycleViewMode: () => string;
  getStatus: () => any;
}

declare global {
  interface Window {
    avatarAPI?: AvatarAPI;
  }
}

export default function ControlPanel() {
  const [status, setStatus] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.avatarAPI) {
        setStatus(window.avatarAPI.getStatus());
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleEnableAnimations = async () => {
    if (window.avatarAPI && !animationsEnabled) {
      setAnimationsEnabled(true);
      // Load just a few essential animations first
      const essential = ['idle', 'waving', 'talking'];
      for (const name of essential) {
        try {
          await window.avatarAPI.loadAnimation(name);
        } catch (error) {
          console.warn(`Failed to load ${name}`);
        }
      }
      
      // Play idle
      if (window.avatarAPI.getStatus().loadedAnimations.includes('idle')) {
        window.avatarAPI.playAnimation('idle', { loop: true });
      }
    }
  };

  const handleLoadAll = async () => {
    if (window.avatarAPI) {
      await window.avatarAPI.loadAllAnimations((loaded, total) => {
        setLoadingProgress({ loaded, total });
      });
      setLoadingProgress(null);
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
      <h3 style={styles.title}>🎭 Avatar Control Panel</h3>

      {/* Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>📊 Status</h4>
        {status && (
          <div style={styles.info}>
            <div>Animation: <strong>{status.currentAnimation || 'None'}</strong></div>
            <div>Emotion: <strong>{status.currentEmotion || 'neutral'}</strong></div>
            <div>View: <strong>{status.currentViewMode || 'full-body'}</strong></div>
            <div>Loaded: <strong>{status.loadedAnimations?.length || 0}</strong> animations</div>
          </div>
        )}
      </div>

      {/* Animations */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>🎬 Animations</h4>
        
        {!animationsEnabled && (
          <button onClick={handleEnableAnimations} style={styles.buttonPrimary}>
            ▶️ Enable Animations
          </button>
        )}
        
        {animationsEnabled && (
          <>
            {loadingProgress && (
              <div style={styles.progress}>
                Loading: {loadingProgress.loaded}/{loadingProgress.total}
              </div>
            )}
            <div style={styles.buttonGrid}>
              {status?.loadedAnimations?.map((name: string) => (
                <button
                  key={name}
                  onClick={() => window.avatarAPI?.playAnimation(name)}
                  style={{
                    ...styles.button,
                    ...(status.currentAnimation === name ? styles.buttonActive : {})
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <button onClick={handleLoadAll} style={styles.buttonPrimary}>
              Load All Animations
            </button>
          </>
        )}
      </div>

      {/* Emotions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>😊 Emotions</h4>
        <div style={styles.buttonGrid}>
          {['neutral', 'joy', 'sad', 'angry', 'surprised', 'relaxed'].map((emotion) => (
            <button
              key={emotion}
              onClick={() => window.avatarAPI?.setEmotion(emotion, 1.0)}
              style={{
                ...styles.button,
                ...(status?.currentEmotion === emotion ? styles.buttonActive : {})
              }}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* View Modes */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>📷 View Modes</h4>
        <div style={styles.buttonGrid}>
          {['full-body', 'half-body', 'head-only'].map((mode) => (
            <button
              key={mode}
              onClick={() => window.avatarAPI?.setViewMode(mode, true)}
              style={{
                ...styles.button,
                ...(status?.currentViewMode === mode ? styles.buttonActive : {})
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>⚡ Quick Actions</h4>
        <div style={styles.buttonGrid}>
          <button onClick={() => window.avatarAPI?.stopAnimation(0.5)} style={styles.button}>
            Stop Animation
          </button>
          <button onClick={() => window.avatarAPI?.cycleViewMode()} style={styles.button}>
            Cycle View
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    maxWidth: '320px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 'bold' as const,
  },
  section: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  info: {
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#cbd5e1',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '8px',
  },
  button: {
    padding: '8px 12px',
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '6px',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  buttonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: '#3b82f6',
    color: '#fff',
  },
  buttonPrimary: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold' as const,
  },
  loading: {
    fontSize: '13px',
    color: '#94a3b8',
    fontStyle: 'italic' as const,
  },
  progress: {
    fontSize: '12px',
    color: '#60a5fa',
    marginBottom: '8px',
    fontWeight: 'bold' as const,
  },
};
