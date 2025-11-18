import React, { useState, useCallback } from 'react';
import AvatarCanvas from './components/AvatarCanvas';
import Controls from './components/Controls';
import DebugPanel from './components/DebugPanel';

function App() {
  const [avatarController, setAvatarController] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState({
    status: 'Initializing...',
    phonemesActive: false,
    animationTime: 0
  });

  const handleAvatarReady = useCallback((controller: any) => {
    console.log('✅ Avatar controller ready');
    setAvatarController(controller);
    setDebugInfo(prev => ({ ...prev, status: 'Avatar loaded' }));
  }, []);

  const updateDebugInfo = useCallback((info: any) => {
    setDebugInfo(prev => ({ ...prev, ...info }));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AvatarCanvas 
        onAvatarReady={handleAvatarReady}
        onDebugUpdate={updateDebugInfo}
      />
      <Controls 
        avatarController={avatarController}
        onDebugUpdate={updateDebugInfo}
      />
      <DebugPanel info={debugInfo} />
    </div>
  );
}

export default App;
