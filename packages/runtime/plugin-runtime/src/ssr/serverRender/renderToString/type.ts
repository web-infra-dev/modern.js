export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type RenderResult = {
  renderLevel: RenderLevel;
  html?: string;
  chunksMap: {
    js: string;
    css: string;
  };
};
