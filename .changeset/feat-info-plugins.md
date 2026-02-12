---
"@modern-js/app-tools": minor
---

feat(app-tools): enhance info command to display plugins

- Collect and display CLI, server, and runtime plugins in `modern info` output.
- Add new types: `CliPluginInfo`, `RuntimePluginInfo`, `ServerPluginInfo`, and `PluginsInfo`.
- Preserve plugin execution order and include plugin options/config where present.
- Improve human-readable formatting for entries and plugins sections.
