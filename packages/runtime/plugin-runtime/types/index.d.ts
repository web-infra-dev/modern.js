import { StateConfig } from '../dist/types';

declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    state?: StateConfig | boolean;
  }
}

declare module '@modern-js/module-tools' {
  interface RuntimeUserConfig {
    state?: StateConfig | boolean;
  }
}

declare module 'http' {
  interface ServerResponse {
    locals: Record<string, any>;
  }
}

declare module 'react-router-dom' {
  interface LoaderFunctionArgs {
    context: {
      ctx: unknown;
    };
  }
}
