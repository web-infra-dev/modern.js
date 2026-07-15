(1) 不是 /api/user/:username/info，实际路径是 /user/[username]/info（BFF 不加前缀，动态段保留方括号）。
(2) 前缀不在 bff.prefix 里改，而是改 server.baseUrl。
