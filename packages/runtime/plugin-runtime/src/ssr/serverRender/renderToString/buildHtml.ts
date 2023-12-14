export type BuildHtmlCb = (tempalte: string) => string;

/**
 * It is unsafe unsafeReplace, only support serachValue exsit one time.
 * @param source
 * @param searchValue
 * @param replaceValue
 * @returns
 */
function unsafeReplace(
  source: string,
  searchValue: RegExp | string,
  replaceValue: string,
) {
  const [s1, s2] = source.split(searchValue);
  return s1 + replaceValue + s2;
}

export function buildHtml(template: string, callbacks: BuildHtmlCb[]) {
  return callbacks.reduce((tmp, cb) => cb(tmp), template);
}

export function createReplaceHtml(html: string): BuildHtmlCb {
  const HTML_REMARK = '<!--<?- html ?>-->';
  return (template: string) => unsafeReplace(template, HTML_REMARK, html);
}

export function createReplaceSSRDataScript(data: string): BuildHtmlCb {
  const SSR_DATA_REMARK = '<!--<?- SSRDataScript ?>-->';
  return (template: string) => unsafeReplace(template, SSR_DATA_REMARK, data);
}

export function createReplaceChunkJs(js: string): BuildHtmlCb {
  const CHUNK_JS_REMARK = '<!--<?- chunksMap.js ?>-->';
  return (template: string) => unsafeReplace(template, CHUNK_JS_REMARK, js);
}

export function createReplaceChunkCss(css: string): BuildHtmlCb {
  const CHUNK_CSS_REG = '<!--<?- chunksMap.css ?>-->';
  return (template: string) => unsafeReplace(template, CHUNK_CSS_REG, css);
}
