import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  message: string;
  handle: string;
}

export function Outro({ message, handle }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, from: 0.6, to: 1 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, from: 0, to: 1 });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        gap: 24,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <p style={{ color: '#fff', fontSize: 56, fontWeight: 800, textAlign: 'center', padding: '0 60px' }}>
        {message}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 40, fontWeight: 600 }}>
        {handle}
      </p>
    </div>
  );
}
