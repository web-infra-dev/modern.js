---
'@modern-js/builder': minor
---

feat: add `pluginPerformanceBudget`, which checks first-screen JS/CSS size, initial request count, async chunk count, duplicate packages and the dynamic import depth of critical chunks against budgets after production builds, and writes a JSON report and a Markdown summary that can be compared with a baseline report and posted on pull requests
