declare module 'webpack-sources' {
  declare class RawSource {
    // eslint-disable-next-line node/prefer-global/buffer
    constructor(value: string | Buffer);
    source(): string;
  }
}
