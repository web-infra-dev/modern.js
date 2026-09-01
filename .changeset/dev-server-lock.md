---
'@modern-js/app-tools': patch
---

feat: add a project operation lock: `dev`/`start` register a shared lock and `build`/`deploy`/`inspect` hold an exclusive lock, so a second `modern dev` (or a build during dev) fails fast with the running instance's URL, PID and kill command instead of silently switching ports or clobbering `dist`. Finite builds conflicting over the same directories queue automatically instead of failing, `build --watch` stays exclusive for its lifetime, and commands whose `output.tempDir` + `output.distPath` are both distinct run in parallel. Opt in to multiple dev servers with `modern dev --allow-multiple`
