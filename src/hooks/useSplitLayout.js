import { useSyncExternalStore } from "react";

// Viewport-based on purpose: iPadOS Safari identifies itself as a Mac, so the
// user agent cannot detect an iPad. 1100px fits the navigation rail, the home
// column and a detail column that is still wider than the phone layout.
export const SPLIT_LAYOUT_QUERY = "(min-width: 1100px) and (orientation: landscape)";

const subscribe = (onChange) => {
  const media = window.matchMedia(SPLIT_LAYOUT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(SPLIT_LAYOUT_QUERY).matches;
const getServerSnapshot = () => false;

export function useSplitLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
