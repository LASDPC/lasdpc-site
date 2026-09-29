/// <reference types="vite/client" />

declare module "vanta/dist/vanta.globe.min" {
  type VantaGlobeOptions = {
    el: HTMLElement;
    THREE: typeof import("three");
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    color2?: number;
    backgroundColor?: number;
    backgroundAlpha?: number;
    size?: number;
  };

  const GLOBE: (options: VantaGlobeOptions) => { destroy: () => void };
  export default GLOBE;
}

declare module "vanta/dist/vanta.net.min" {
  type VantaNetOptions = {
    el: HTMLElement;
    THREE: typeof import("three");
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    backgroundAlpha?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  };

  const NET: (options: VantaNetOptions) => { destroy: () => void };
  export default NET;
}
