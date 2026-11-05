export interface AppShellInputOptions {
  /**
   * Selector of the text field inside the shell markup that receives early input.
   * @default '[data-app-shell-input]'
   */
  shell?: string;
  /**
   * Selector of the real input rendered by the app. Captured text is replayed into
   * the first visible match when the shell is removed.
   * Defaults to `readySelector`.
   */
  target?: string;
  /**
   * Focus the shell input as soon as it is parsed.
   * @default false
   */
  autofocus?: boolean;
  /**
   * After replaying, keep the text in place for this many milliseconds: if the app
   * re-mounts or resets its input, the text is applied again. Any key press or pointer
   * down ends the window early.
   * @default 3000
   */
  settle?: number;
}

export interface AppShellCriticalCssOptions {
  /**
   * Also scan async CSS chunks emitted by the build, not only the stylesheets
   * linked from the entry HTML.
   * @default true
   */
  includeAsyncCss?: boolean;
  /**
   * Rules whose selector matches one of these are always kept, e.g. theme variables
   * declared on `[data-theme=dark]`.
   * @default [/^:root/, /^html/, /^body/, /^\[data-theme/]
   */
  allowRules?: (string | RegExp)[];
}

export interface AppShellEntryOptions {
  /**
   * Path of a module whose default export is a React component without props.
   * It is rendered to static HTML once, at build time.
   */
  component: string;
  /**
   * Pathnames where the shell is shown. Strings match exactly (a trailing slash is
   * ignored), regular expressions are tested against `location.pathname`.
   * When omitted the shell is shown on every pathname of the entry.
   */
  routes?: (string | RegExp)[];
  /**
   * The shell is removed once an element matching this selector is rendered inside
   * the mount node and every stylesheet linked from the document has loaded.
   * When omitted, the first element rendered into the mount node counts as ready.
   */
  readySelector?: string;
  /**
   * Keep the shell for this many milliseconds after the app first counts as ready. Apps
   * often reset their input once more right after mounting; with early input capture the
   * replay then lands after that reset.
   * @default 200 with `input` enabled, otherwise 0
   */
  readyHold?: number;
  /**
   * Remove the shell after this many milliseconds from navigation start even when
   * the app never becomes ready, so an error page is never hidden behind it.
   * @default 15000
   */
  timeout?: number;
  /**
   * Capture what the user types into the shell and replay it into the app.
   * Pass `false` to disable.
   */
  input?: AppShellInputOptions | false;
  /**
   * Inline the subset of the app CSS used by the shell markup.
   * Pass `false` to rely on the shell component's own inline styles only.
   */
  criticalCss?: AppShellCriticalCssOptions | false;
  /**
   * Load the entry stylesheets without blocking the first paint, so the shell paints
   * as soon as the HTML arrives. The shell stays on top until the stylesheets load,
   * which hides the unstyled app underneath.
   * @default false
   */
  deferStylesheets?: boolean;
}

export interface AppShellPluginOptions {
  /** Shell configuration keyed by entry name. */
  entries: Record<string, AppShellEntryOptions>;
}

/** Serializable options handed to the inline runtime. */
export interface AppShellRuntimeConfig {
  id: string;
  mountId: string;
  routes: { exact?: string; pattern?: string; flags?: string }[] | null;
  readySelector: string | null;
  readyHold: number;
  timeout: number;
  input: {
    shell: string;
    target: string | null;
    autofocus: boolean;
    settle: number;
  } | null;
  deferStylesheets: boolean;
}
