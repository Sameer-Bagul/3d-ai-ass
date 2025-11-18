import { useState } from 'react';
import AvatarCanvas from './components/AvatarCanvas';
import ControlPanel from './components/ControlPanel';

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e', position: 'relative' }}>
      <AvatarCanvas onLoad={() => setLoaded(true)} />
      
      {loaded && <ControlPanel />}
      
      {!loaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '24px',
          textAlign: 'center',
        }}>
          <div>🎭 Loading Avatar...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            Please wait
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
