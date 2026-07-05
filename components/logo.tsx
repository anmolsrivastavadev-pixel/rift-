/* Brand mark — the "split R": a bold R sheared in two by a diagonal rift,
 * left plate deep blue, right plate lighter and slipped down. Hand-built SVG
 * chosen by the founder from vector candidates (July 2026). Also mirrored in
 * app/icon.svg (favicon) and app/opengraph-image.tsx — keep the three in sync.
 *
 * `id` must be unique per mounted instance: SVG clipPath ids are global to
 * the page, so two marks with the same id would share (identical) clip defs.
 */
export function RiftMark({
  size = 28,
  id = "rift-mark",
  className,
}: {
  size?: number;
  id?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${id}-l`}>
          <polygon points="0,0 42,0 24,64 0,64" />
        </clipPath>
        <clipPath id={`${id}-r`}>
          <polygon points="42,0 64,0 64,64 24,64" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-l)`}>
        <g transform="translate(-1.1,-1)">
          <text
            x="32"
            y="54"
            fontFamily="Inter, 'Segoe UI', Arial, sans-serif"
            fontSize="58"
            fontWeight="800"
            fill="#2563EB"
            textAnchor="middle"
          >
            R
          </text>
        </g>
      </g>
      <g clipPath={`url(#${id}-r)`}>
        <g transform="translate(1.1,1)">
          <text
            x="32"
            y="54"
            fontFamily="Inter, 'Segoe UI', Arial, sans-serif"
            fontSize="58"
            fontWeight="800"
            fill="#3B7CFF"
            textAnchor="middle"
          >
            R
          </text>
        </g>
      </g>
    </svg>
  );
}
