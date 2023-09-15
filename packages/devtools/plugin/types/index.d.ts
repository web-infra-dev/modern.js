import { Options } from '../dist';

declare module '@modern-js/app-tools' {
  interface SharedUserConfig {
    devtools?: false | Options;
  }
}
