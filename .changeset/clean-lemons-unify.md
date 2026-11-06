---
'@modern-js/plugin-i18n': patch
---

Use the current application context for locale entry paths in ordinary pages and Bridge exports. Cancel initialization polling and SDK resource retry timers when the application is disposed, and ignore pending resource reload completions after unmount.
