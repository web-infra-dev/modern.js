---
'@modern-js/app-tools': patch
---

feat: add a project operation lock: `dev`/`start` register a shared lock and `build`/`deploy` hold an exclusive lock, so a second `modern dev` (or a build during dev) fails fast with the running instance's URL, PID and kill command instead of silently switching ports or clobbering `dist`; opt in to multiple dev servers with `modern dev --allow-multiple`
