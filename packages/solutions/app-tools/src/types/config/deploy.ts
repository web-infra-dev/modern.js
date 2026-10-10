import type { NodeFileTraceOptions } from 'ndepe';

export interface MicroFrontend {
  /**
   * Specifies whether to enable the HTML entry.
   * When set to `true`, the current child application will be externalized for `react` and `react-dom`.
   * @default true
   */
  enableHtmlEntry?: boolean;
  /**
   * Specifies whether to use the external base library.
   * @default false
   */
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export interface DeployUserConfig {
  /**
   * Used to configure micro-frontend sub-application information.
   * @default false
   */
  microFrontend?: boolean | MicroFrontend;
  worker?: {
    ssr?: boolean;
  };
  /**
   * Options forwarded to `@vercel/nft` when tracing server-side dependencies.
   *
   * Tracing runs with the filesystem root as its base, so static analysis of
   * `__dirname`-based patterns in the server bundle can reach directories that
   * are unrelated to the application and may be unreadable on the build
   * machine. Use `ignore` to exclude them.
   *
   * @example
   * ```ts
   * export default defineConfig({
   *   deploy: {
   *     traceOptions: {
   *       ignore: ['etc/**', 'private/etc/**'],
   *     },
   *   },
   * });
   * ```
   */
  traceOptions?: NodeFileTraceOptions;
}
