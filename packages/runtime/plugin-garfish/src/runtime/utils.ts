declare const __GARFISH_EXPORTS__: string;

export function isRenderGarfish(params?: { appName?: string }) {
  const renderByGarfish =
    typeof __GARFISH_EXPORTS__ !== 'undefined' ||
    (typeof window !== 'undefined' &&
      window.Garfish &&
      window.Garfish.activeApps &&
      window.Garfish.activeApps.some(
        app => app.appInfo?.name === params?.appName,
      ));
  return renderByGarfish;
}
