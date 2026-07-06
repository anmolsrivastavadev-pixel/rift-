import { Composition } from "remotion";
import { RiftPromo, TOTAL_DURATION } from "./RiftPromo";
import { HeroDemo, HERO_DEMO_DURATION } from "./HeroDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RiftPromo"
        component={RiftPromo}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Looping demo for the landing hero's product window (same aspect
          ratio as the hero card) */}
      <Composition
        id="HeroDemo"
        component={HeroDemo}
        durationInFrames={HERO_DEMO_DURATION}
        fps={30}
        width={1040}
        height={1200}
      />
    </>
  );
};
