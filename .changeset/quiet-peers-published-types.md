---
'@modern-js/adapter-rstest': patch
'@modern-js/plugin-bff': patch
'@modern-js/plugin-data-loader': patch
'@modern-js/plugin-ssg': patch
'@modern-js/plugin-styled-components': patch
'@modern-js/plugin-i18n': patch
'@modern-js/image': patch
'@modern-js/runtime': patch
'@modern-js/bff-core': patch
'@modern-js/server-core': patch
'@modern-js/create-request': patch
'@modern-js/plugin-polyfill': patch
'@modern-js/prod-server': patch
'@modern-js/server': patch
'@modern-js/server-utils': patch
'@modern-js/app-tools': patch
'@modern-js/mcp-apps': patch
'@modern-js/plugin': patch
'@modern-js/types': patch
'@modern-js/utils': patch
---

Fix published dependency contracts and declaration entry points.

Declare framework and React/Node type hosts as peers while keeping local development versions. Provide shared type utilities as dependencies where their public declarations require them. Correct declaration paths and retain the compiled utility files in published packages without changing framework runtime behavior.
