# @modern-js/plugin-app-shell

Build-time app shell for client-rendered pages. The plugin renders a static React component
(the layout: sidebar, header, input box frame) into the entry HTML at build time and inlines
the CSS it needs, so the page paints its layout as soon as the HTML arrives instead of after
the entry bundle has downloaded and run. The app itself keeps rendering on the client exactly
as before; no SSR is required.

While the app loads, text typed into the shell's input is captured. When the app renders its
real input, the shell is removed and the text, focus and caret move over to the real input.

## Usage

```ts title="modern.config.ts"
import { appTools, defineConfig } from '@modern-js/app-tools';
import { appShellPlugin } from '@modern-js/plugin-app-shell';

export default defineConfig({
  plugins: [
    appTools(),
    appShellPlugin({
      entries: {
        main: {
          component: './src/app-shell.tsx',
          routes: ['/', '/chat'],
          readySelector: 'textarea[data-testid="chat-input"]',
        },
      },
    }),
  ],
});
```

```tsx title="src/app-shell.tsx"
// Rendered once at build time with renderToStaticMarkup: no state, effects or data.
export default function AppShell() {
  return (
    <div className="layout">
      <nav className="sidebar">…</nav>
      <main>
        <textarea data-app-shell-input placeholder="Ask anything" />
      </main>
    </div>
  );
}
```

Reuse the app's own class names in the shell: the plugin keeps the rules of the app CSS (entry
and async chunks) that match the shell markup and inlines them, so the shell looks like the
first frame of the app.

## How it works

- The shell is injected next to the mount node (`html.mountId`), never into it, so client
  rendering and hydration see the same DOM as without the plugin.
- A small inline script decides from `location.pathname` whether the shell applies. Pages
  outside `routes` drop it before it paints.
- The shell is removed when `readySelector` matches inside the mount node (or, without it, when
  the app renders its first element) and the entry stylesheets have loaded. `timeout` removes it
  in any case, so an error page is never hidden.
- Early input: printable input, IME composition and focus are kept in the shell's field and
  replayed into the real input with `insertText`, which frameworks see as normal user input. The
  replay waits for an IME composition to end, and is re-applied for a short `settle` window if the
  app re-mounts its input right after the first render.

## Options

See the `AppShellEntryOptions` type for the full list: `component`, `routes`, `readySelector`,
`timeout`, `input` (`shell`, `target`, `autofocus`, `settle`), `criticalCss`
(`includeAsyncCss`, `allowRules`) and `deferStylesheets`.
