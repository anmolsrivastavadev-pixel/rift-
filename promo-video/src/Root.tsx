import { Composition } from "remotion";
import { RiftPromo, TOTAL_DURATION } from "./RiftPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="RiftPromo"
      component={RiftPromo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
