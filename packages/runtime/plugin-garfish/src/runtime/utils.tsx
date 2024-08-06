declare const __GARFISH_EXPORTS__: string;

export function isRenderGarfish() {
  return typeof __GARFISH_EXPORTS__ !== 'undefined';
}
