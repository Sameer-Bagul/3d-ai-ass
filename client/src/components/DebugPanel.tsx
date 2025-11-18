import React from 'react';

interface DebugPanelProps {
  info: {
    status: string;
    phonemesActive: boolean;
    animationTime: number;
  };
}

export default function DebugPanel({ info }: DebugPanelProps) {
  return (
    <div className="debug-panel">
      <h3>🔧 Debug Info</h3>
      <p><strong>Status:</strong> {info.status}</p>
      <p><strong>Phonemes Active:</strong> {info.phonemesActive ? '✅ Yes' : '❌ No'}</p>
      <p><strong>Animation Time:</strong> {info.animationTime.toFixed(2)}s</p>
      <p style={{ marginTop: '10px', fontSize: '10px', opacity: 0.6 }}>
        Press Test Lip-Sync to see the avatar animate
      </p>
    </div>
  );
}
