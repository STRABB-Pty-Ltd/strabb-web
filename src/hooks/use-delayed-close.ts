import { useEffect, useRef, useState } from "react";

/**
 * Keeps a component mounted briefly after `open` flips to false so an exit
 * animation can play before unmount. Pair with `slideOutRight`, `fadeOut`,
 * or `scaleOut` keyframes (see globals.css).
 *
 * - shouldRender: render the node when this is true (open OR exiting).
 * - exiting: true while the close animation is playing - branch on this to
 *   pick the exit keyframe.
 *
 * Guarded by a wasOpened ref so an initial `open=false` stays unmounted -
 * the exit animation only fires after the component has actually been open.
 */
export function useDelayedClose(open: boolean, durationMs: number = 300) {
  const [exiting, setExiting] = useState(false);
  const wasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpened.current = true;
      setExiting(false);
    } else if (wasOpened.current) {
      setExiting(true);
      const t = setTimeout(() => setExiting(false), durationMs);
      return () => clearTimeout(t);
    }
  }, [open, durationMs]);

  return { shouldRender: open || exiting, exiting };
}
