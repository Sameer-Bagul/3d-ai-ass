import React, { useState, useCallback } from 'react';
import AvatarCanvas from './components/AvatarCanvas';
import Controls from './components/Controls';
import DebugPanel from './components/DebugPanel';
import AvatarController from './components/AvatarController';
import ViewModeController from './lib/viewModes';

function App() {
  const [avatarController, setAvatarController] = useState<AvatarController | null>(null);
  const [viewModeController, setViewModeController] = useState<ViewModeController | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    status: 'Initializing...',
    phonemesActive: false,
    animationTime: 0
  });

  const handleAvatarReady = useCallback((controller: AvatarController, viewController: ViewModeController) => {
    console.log('✅ Avatar controller ready');
    setAvatarController(controller);
    setViewModeController(viewController);
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
        viewModeController={viewModeController}
        onDebugUpdate={updateDebugInfo}
      />
      <DebugPanel info={debugInfo} />
    </div>
  );
}

export default App;
