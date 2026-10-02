#!/usr/bin/env bash
set -euo pipefail
# 用法: bash run-lint.sh <projectDir> —— 找到 lint/format 脚本做一次自动修复
project_dir="${1:-}"
[[ -z "$project_dir" ]] && { echo "usage: run-lint.sh <projectDir>" >&2; exit 1; }
pkg="$project_dir/package.json"
[[ -f "$pkg" ]] || { echo "skip: package.json not found"; exit 0; }
name="$(node -e '
  const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")).scripts||{};
  process.stdout.write(["lint:fix","format:fix","lint","format"].find(n=>p[n])||"");
' "$pkg")"
[[ -z "$name" ]] && { echo "skip: no lint/format script"; exit 0; }
echo "run: npm run $name"; cd "$project_dir"; CI=true npm run "$name"
