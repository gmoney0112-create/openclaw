import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  label: string;
}

export function LowerThird({ label }: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 18 }, from: 0, to: 1 });
  const x = interpolate(progress, [0, 1], [-600, 0]);

  // Fade out near the end
  const endFade = interpolate(frame, [durationInFrames - 15, durationInFrames - 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 140,
        paddingLeft: 60,
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#fff',
          padding: '16px 32px',
          borderRadius: 8,
          fontSize: 40,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          transform: `translateX(${x}px)`,
          opacity: endFade,
          letterSpacing: '-0.5px',
        }}
      >
        {label}
      </div>
    </div>
  );
}
