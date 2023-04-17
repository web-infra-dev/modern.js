---
'@modern-js/builder-shared': patch
---

fix: The http://0.0.0.0:port can't visit in windows, we shouldn't set publicPath as `//0.0.0.0:${port}/`;
fix: 在 windows 里不能正常访问 http://0.0.0.0:port，我们不应该将 publicPath 设置成 `//0.0.0.0:${port}`
