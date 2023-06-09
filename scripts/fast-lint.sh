#!/usr/bin/env bash

TARGET_BRANCH=origin/main
if [ ! -z ${GITHUB_BASE_REF+x} ]; then
  git fetch origin ${GITHUB_BASE_REF}
  TARGET_BRANCH=origin/${GITHUB_BASE_REF}
fi

# build @modern-js/eslint-config and related packages
pnpm run --filter @modern-js/eslint-config... build

# run eslint --no-fix
env \
  DEBUG=eslint:cli-engine \
  NODE_OPTIONS=--max_old_space_size=16384 \
  TIMING=1 \
  npx eslint \
  --quiet \
  $(git diff --diff-filter=ACM ${TARGET_BRANCH}... --name-only | grep -E '\.(js|jsx|ts|tsx|mjs|mjsx|cjs|cjsx)$')
