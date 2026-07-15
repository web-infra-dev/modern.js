(1) 开启 server.ssr.forceCSR: true（modern.config.ts 中 server: { ssr: { forceCSR: true } }）。
(2) 两种方式让某次请求走 CSR：请求 URL 加查询参数 ?csr=true；或给请求带上 x-modern-ssr-fallback 请求头。
