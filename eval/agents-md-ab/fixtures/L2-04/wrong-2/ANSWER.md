不要用 modern deploy（它只是 build 的别名），直接 modern build 即可。
MODERNJS_DEPLOY=netlify 这种写法并不存在。
产物不在 dist，也不在 static/js，而是统一在 output/ 目录。
