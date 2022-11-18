declare module 'webpack/lib/Stats' {
  import type * as webpack from 'webpack';

  export class Stats extends webpack.Stats {}
}
