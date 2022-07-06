import { BrowserHistoryBuildOptions, HashHistoryBuildOptions } from 'history';

type HistoryConfig =
  | {
      supportHtml5History: true;
      historyOptions: BrowserHistoryBuildOptions;
    }
  | {
      supportHtml5History: false;
      historyOptions: HashHistoryBuildOptions;
    };

type StateConfig = {
  immer: boolean;
  effects: boolean;
  autoActions: boolean;
  devtools: boolean | Record<string, any>;
};

export interface RuntimeConfig {
  router?: boolean | HistoryConfig;
  state?: boolean | StateConfig;
  [name: string]: any;
}
