---
'@modern-js/plugin-module-federation': minor
'@modern-js/app-tools': minor
---

Integrate Module Federation as a built-in Modern.js capability. Automatically detect module-federation.config.ts, expose moduleFederation adapter options, preserve the existing CSR/SSR and data-fetch behavior, and reject simultaneous legacy-plugin registration. Set moduleFederation to false to retain the legacy integration. Runtime APIs and types use the unified enhanced/runtime entry without extra lower-level runtime application dependencies. Default the top-level shareStrategy to loaded-first at build time while honoring explicit configuration, without injecting a shared-strategy runtime plugin.

Resolve SSR output directories from the final bundler path or user distPath configuration with the framework default directory constant. Remove unused Bridge forwarding entries and obsolete browser fallbacks.

Retain the CLI configuration, SSR, data-fetch server plugin and type entry points. Remove the broad Enhanced runtime forwarding facade. Use the resolved application output directory and development port, and honor the server output directory when serving federated JavaScript.
