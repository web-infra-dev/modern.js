import path from 'path';
import type { NormalizedConfig } from '@modern-js/core';
import { fs, normalizeOutputPath } from '@modern-js/utils';
import { template } from '@modern-js/utils/lodash';
import { STORYBOOK_TEMPLATE_DIR } from '../constants';

const INTERPOLATE_REGEXP = /<%=([\s\S]+?)%>/g;

export type MainOptions = {
  appDirectory: string;
  disableTsChecker: boolean;
  stories: string[];
  isTsProject: boolean;
};

const MAIN_TEMPLATE = path.join(STORYBOOK_TEMPLATE_DIR, 'main.tmpl');

export const generateMain = (options: MainOptions) => {
  const mainTemplate = fs.readFileSync(MAIN_TEMPLATE, 'utf-8');
  const injects: Record<string, string> = {
    appDirectory: normalizeOutputPath(options.appDirectory),
    sbConfigDir: normalizeOutputPath(
      path.resolve(options.appDirectory, 'config/storybook'),
    ),
    userMainPath: normalizeOutputPath(
      path.resolve(options.appDirectory, 'config/storybook/main.js'),
    ),
    disableTsChecker: String(options.disableTsChecker),
    stories: JSON.stringify(options.stories),
    isTsProject: String(options.isTsProject),
  };
  const execute = template(mainTemplate, { interpolate: INTERPOLATE_REGEXP });
  return execute(injects);
};

export type PreviewOptions = {
  userPreviewPath?: string;
  runtime: NormalizedConfig['runtime'];
  designToken: Record<string, any>;
};

const PREVIEW_TEMPLATE = path.join(STORYBOOK_TEMPLATE_DIR, 'preview.tmpl');
const USER_PREVIEW_TEMPLATE = path.join(
  STORYBOOK_TEMPLATE_DIR,
  'user-preview.tmpl',
);

export const generatePreview = (options: PreviewOptions) => {
  const previewTemplate = fs.readFileSync(
    options.userPreviewPath ? USER_PREVIEW_TEMPLATE : PREVIEW_TEMPLATE,
    'utf-8',
  );
  const injects: Record<string, string> = {
    userPreviewPath: options.userPreviewPath || '',
    runtime: JSON.stringify(options.runtime || {}),
    designToken: JSON.stringify(options.designToken),
  };
  const execute = template(previewTemplate, {
    interpolate: INTERPOLATE_REGEXP,
  });
  return execute(injects);
};
