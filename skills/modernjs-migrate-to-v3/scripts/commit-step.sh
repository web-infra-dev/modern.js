#!/usr/bin/env bash
set -euo pipefail
# 用法: bash commit-step.sh <projectDir> <message> [--include-lockfiles]
# 仅提交 projectDir 内变更；无变更跳过；关闭 hooks 避免被仓库差异卡住。

project_dir="${1:-}"; message="${2:-}"; include_lockfiles="${3:-}"
if [[ -z "$project_dir" || -z "$message" ]]; then
  echo "usage: commit-step.sh <projectDir> <message> [--include-lockfiles]" >&2; exit 1
fi
root_dir="$(git -C "$project_dir" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$root_dir" ]]; then echo "skip: not a git repository"; exit 0; fi

extra_paths=()
if [[ "$include_lockfiles" == "--include-lockfiles" ]]; then
  while IFS= read -r -d '' f; do extra_paths+=("$f"); done \
    < <(find "$root_dir" -type f \( -name 'pnpm-lock.yaml' -o -name 'yarn.lock' -o -name 'package-lock.json' \) -not -path '*/node_modules/*' -print0)
fi
cd "$root_dir"
status_args=("$project_dir"); [[ "${#extra_paths[@]}" -gt 0 ]] && status_args+=("${extra_paths[@]}")
if [[ -z "$(git status --porcelain -- "${status_args[@]}")" ]]; then echo "skip: no changes"; exit 0; fi
git add -- "$project_dir"
[[ "${#extra_paths[@]}" -gt 0 ]] && git add -- "${extra_paths[@]}"
if [[ -z "$(git diff --cached --name-only -- "${status_args[@]}")" ]]; then echo "skip: nothing staged"; exit 0; fi
git commit --no-verify -m "$message"
