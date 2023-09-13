corepack enable
pnpm i --ignore-scripts
pnpm prepare
cd packages/devtools/client
pnpm build