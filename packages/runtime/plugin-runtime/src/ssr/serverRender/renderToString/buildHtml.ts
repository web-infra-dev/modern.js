import { safeReplace } from '../utils';
import {
  HTML_PLACEHOLDER,
  SSR_DATA_PLACEHOLDER,
  CHUNK_JS_PLACEHOLDER,
  CHUNK_CSS_PLACEHOLDER,
} from '../constants';

export type BuildHtmlCb = (tempalte: string) => string;

export function buildHtml(template: string, callbacks: BuildHtmlCb[]) {
  return callbacks.reduce((tmp, cb) => cb(tmp), template);
}

export function createReplaceHtml(html: string): BuildHtmlCb {
  return (template: string) => safeReplace(template, HTML_PLACEHOLDER, html);
}

export function createReplaceSSRDataScript(data: string): BuildHtmlCb {
  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, data);
}

export function createReplaceChunkJs(js: string): BuildHtmlCb {
  return (template: string) => safeReplace(template, CHUNK_JS_PLACEHOLDER, js);
}

export function createReplaceChunkCss(css: string): BuildHtmlCb {
  return (template: string) =>
    safeReplace(template, CHUNK_CSS_PLACEHOLDER, css);
}
