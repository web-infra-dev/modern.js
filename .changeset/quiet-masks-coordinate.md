---
'@modern-js/server-core': patch
---

Add configurable wait, CSR and reject policies for requests that arrive during SSR updates, with request metadata, update-state snapshots and bounded FIFO queue resumption. Support deferred update submission after the originating response and tracked producer work finish, while preserving direct-update deadlock protection.

为 SSR 更新期间到达的请求提供可配置的等待、CSR 降级和拒绝策略，支持请求信息、更新状态及有界 FIFO 唤醒。在原请求响应和已跟踪的生产任务结束后执行延迟提交的更新，并保留直接更新的防死锁检查。
