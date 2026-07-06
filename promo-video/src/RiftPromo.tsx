import React from "react";
import { Sequence } from "remotion";
import { Backdrop, SceneFade } from "./common";
import { Intro } from "./scenes/Intro";
import { Complaints } from "./scenes/Complaints";
import { Clustering } from "./scenes/Clustering";
import { IdeaScore } from "./scenes/IdeaScore";
import { Compare } from "./scenes/Compare";
import { Outro } from "./scenes/Outro";

// 30 fps timeline
const SCENES = [
  { component: Intro, duration: 105 }, // 3.5s
  { component: Complaints, duration: 195 }, // 6.5s
  { component: Clustering, duration: 180 }, // 6s
  { component: IdeaScore, duration: 220 }, // ~7.3s
  { component: Compare, duration: 150 }, // 5s
  { component: Outro, duration: 135 }, // 4.5s — pricing line needs time to read
];

export const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

// Precomputed start frame for each scene (lint forbids mutating a local
// variable while React renders).
const SCENE_STARTS = SCENES.map(
  (_, i) => SCENES.slice(0, i).reduce((sum, s) => sum + s.duration, 0)
);

export const RiftPromo: React.FC = () => {
  return (
    <Backdrop>
      {SCENES.map(({ component: Scene, duration }, i) => {
        const start = SCENE_STARTS[i];
        return (
          <Sequence key={i} from={start} durationInFrames={duration}>
            <SceneFade durationInFrames={duration}>
              <Scene />
            </SceneFade>
          </Sequence>
        );
      })}
    </Backdrop>
  );
};
