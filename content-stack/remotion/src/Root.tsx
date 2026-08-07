import React from 'react';
import { Composition } from 'remotion';
import { TitleCard } from './compositions/TitleCard.js';
import { LowerThird } from './compositions/LowerThird.js';
import { Outro } from './compositions/Outro.js';

export function Root() {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ title: 'Your Title Here', subtitle: 'Hook line goes here', color: '#0f172a' }}
      />
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ label: 'Label text' }}
      />
      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ message: 'Follow for more', handle: '@yourhandle' }}
      />
    </>
  );
}
