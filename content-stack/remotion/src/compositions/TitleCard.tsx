import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  title: string;
  subtitle: string;
  color: string;
}

export function TitleCard({ title, subtitle, color }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 20 }, from: 0, to: 1 });
  const titleY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' });

  const subtitleOpacity = spring({ frame: frame - 10, fps, config: { damping: 20 }, from: 0, to: 1 });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 60px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          letterSpacing: '-1px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 36,
          fontWeight: 500,
          textAlign: 'center',
          marginTop: 32,
          opacity: subtitleOpacity,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
