import * as path from 'path';

export const CORE_JS_PATH = require.resolve('core-js/package.json');
export const SWC_HELPERS_PATH = require.resolve('@swc/helpers/package.json');

export const CORE_JS_DIR_PATH = path.dirname(CORE_JS_PATH);
export const SWC_HELPERS_DIR_PATH = path.dirname(SWC_HELPERS_PATH);

export const JS_REGEX = /\.js$/;
export const CSS_REGEX = /\.css$/;
