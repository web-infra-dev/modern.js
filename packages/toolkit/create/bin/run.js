#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const pkgInfo = require(path.join(__dirname, '../package.json'));
const srcPath = pkgInfo['jsnext:source'];
const distPath = pkgInfo.main;
const project = path.join(__dirname, '../tsconfig.json');

let env = 'production';
if (fs.existsSync(project)) {
  env = 'development';
}
if (process.env.CODESMITH_ENV) {
  env = process.env.CODESMITH_ENV;
}

const entry = path.join(
  __dirname,
  `../${env === 'development' ? srcPath : distPath}`,
);

if (env === 'development') {
  try {
    // 从当前包的 node_modules 中解析 tsx/esm/api
    // 使用 require.resolve 来找到 tsx 包的位置
    const packageRoot = path.join(__dirname, '..');
    let tsxApiPath = 'tsx/esm/api';

    try {
      // 尝试解析 tsx 包的 package.json
      const tsxPackageJson = require.resolve('tsx/package.json', {
        paths: [packageRoot],
      });
      const tsxPackageDir = path.dirname(tsxPackageJson);
      // 根据 tsx 的 exports 配置，esm/api 指向 dist/esm/api/index.mjs
      const tsxApiFile = path.join(
        tsxPackageDir,
        'dist',
        'esm',
        'api',
        'index.mjs',
      );
      if (fs.existsSync(tsxApiFile)) {
        tsxApiPath = pathToFileURL(tsxApiFile).href;
      }
    } catch {
      // 如果解析失败，使用默认的模块名（Node.js 会从工作区的 node_modules 中查找）
    }

    const { register } = await import(tsxApiPath);
    register({
      tsconfig: project,
    });
    await import(pathToFileURL(entry).href);
  } catch (error) {
    console.error('Error: Cannot load TypeScript file in development mode.');
    console.error('Please install tsx: pnpm add -D tsx');
    console.error('Or build the project: pnpm build');
    console.error(error);
    process.exit(1);
  }
} else {
  import(pathToFileURL(entry).href).catch(e => {
    console.error(e);
  });
}
