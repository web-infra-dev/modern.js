#!/usr/bin/env bash
set -euo pipefail
# 用法: bash install-deps.sh <projectDir> —— 按锁文件检测包管理器并在仓库根安装
project_dir="${1:-$(pwd)}"
root_dir="$(git -C "$project_dir" rev-parse --show-toplevel 2>/dev/null || printf '%s\n' "$project_dir")"
if   [[ -f "$root_dir/pnpm-lock.yaml" ]]; then tool=pnpm; cmd=(pnpm install)
elif [[ -f "$root_dir/yarn.lock" ]];      then tool=yarn; cmd=(yarn install)
elif [[ -f "$root_dir/package-lock.json" ]]; then tool=npm; cmd=(npm install)
else tool=pnpm; cmd=(pnpm install); fi
echo "rootDir: $root_dir"; echo "packageManager: $tool"
cd "$root_dir"; "${cmd[@]}"
