import { ModernServerOptions } from '@modern-js/prod-server';
import type { webpack } from '@modern-js/webpack';

export type DevServerOptions = {
  // hmr client 配置
  client: {
    path?: string;
    port?: string;
    host?: string;
    logging?: string;
    overlay?: boolean;
    progress?: boolean;
  };
  devMiddleware: {
    writeToDisk: boolean | ((filename: string) => boolean);
  };
  // 是否监听文件变化
  watch: boolean;
  // 是否开启 hot reload
  hot: boolean | string;
  // 是否开启 page reload
  liveReload: boolean;
  // 是否开启 https
  https?: boolean | { key: string; cert: string };
  [propName: string]: any;
};

export type ExtraOptions = {
  dev?: boolean | Partial<DevServerOptions>;
  compiler?: webpack.MultiCompiler | webpack.Compiler | null;
};

export type ModernDevServerOptions = ModernServerOptions & ExtraOptions;
