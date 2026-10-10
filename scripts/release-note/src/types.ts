export const REPO_OWNER = 'web-infra-dev';
export const REPO_NAME = 'modern.js';
export const REPO_FULL_NAME = `${REPO_OWNER}/${REPO_NAME}`;

export const RSBUILD_REPO_OWNER = 'web-infra-dev';
export const RSBUILD_REPO_NAME = 'rsbuild';
export const APP_TOOLS_PACKAGE_NAME = '@modern-js/app-tools';
export const RSBUILD_PACKAGE_NAME = '@rsbuild/core';
export const APP_TOOLS_PACKAGE_PATH =
  'packages/solutions/app-tools/package.json';

export const CommitTypeTitle: Record<string, string> = {
  performance: 'Performance Improvements ⚡',
  features: 'New Features 🎉',
  bugFix: 'Bug Fixes 🐞',
  doc: 'Docs update 📄',
  dependencies: 'Rsbuild Update 📦',
  other: 'Other Changes ✨',
};

export const CommitTypeZhTitle: Record<string, string> = {
  performance: '性能优化 ⚡',
  features: '新特性 🎉',
  bugFix: 'Bug 修复 🐞',
  doc: '文档更新 📄',
  dependencies: 'Rsbuild 更新 📦',
  other: '其他变更 ✨',
};

export const ChangesTitle = `What's Changed`;
export const ChangesZhTitle = '更新内容';

export type CommitType =
  'performance' | 'features' | 'bugFix' | 'doc' | 'dependencies' | 'other';

export interface CommitObj {
  id: string;
  type: CommitType;
  pullRequestId?: string;
  author?: string;
  message: string;
  summary: string;
  summary_zh: string;
}
