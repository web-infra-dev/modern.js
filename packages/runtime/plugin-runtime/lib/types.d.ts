/// <reference path="../dist/types/index.d.ts" />

import { RouterConfig, StateConfig } from "../dist/types";

declare module '@modern-js/core' {
    interface RuntimeConfig {
      router?: RouterConfig | boolean;
      state?: StateConfig | boolean;
    }
  }
