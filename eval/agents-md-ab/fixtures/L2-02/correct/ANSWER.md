(1) 完整 URL 路径是 /api/user/:username/info —— 默认 BFF 前缀为 /api，动态目录 [username] 映射为 :username。
(2) 在 modern.config.ts 的 bff.prefix 配置项修改：bff: { prefix: '/api-v2' }。
