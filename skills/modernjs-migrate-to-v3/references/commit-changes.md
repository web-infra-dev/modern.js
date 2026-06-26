# 提交代码变更

统一通过 `scripts/commit-step.sh` 完成。

## 用法

```bash
bash scripts/commit-step.sh "<projectDir>" "<message>"
# 安装依赖后（锁文件可能在 monorepo 根）：
bash scripts/commit-step.sh "<projectDir>" "<message>" --include-lockfiles
```

## 规则

- 脚本已限定 `projectDir` 范围，无需手动 `git add`，不要 `git add .`/`-A`
- 无变更时自动跳过，不产生空提交
- 提交信息格式：`chore: migrate modern.js to v3 - <步骤名称>`，如 `chore: migrate modern.js to v3 - 安全自动改写`

## 提交后验证

```bash
git diff --cached --stat
git status --short
```
