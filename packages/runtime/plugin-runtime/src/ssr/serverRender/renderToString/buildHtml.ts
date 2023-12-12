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
  const HTML_REG = /<!--<\?-\s*html\s*\?>-->/;
  return (template: string) => unsafeReplace(template, HTML_REG, html);
}

export function createReplaceSSRDataScript(data: string): BuildHtmlCb {
  const SSR_DATA_REG = /<!--<\?-\s*SSRDataScript\s*\?>-->/;
  return (template: string) => unsafeReplace(template, SSR_DATA_REG, data);
}

export function createReplaceChunkJs(js: string): BuildHtmlCb {
  const CHUNK_JS_REG = /<!--<\?-\s*chunksMap\.js\s*\?>-->/;
  return (template: string) => unsafeReplace(template, CHUNK_JS_REG, js);
}

export function createReplaceChunkCss(css: string): BuildHtmlCb {
  const CHUNK_CSS_REG = /<!--<\?-\s*chunksMap\.css\s*\?>-->/;
  return (template: string) => unsafeReplace(template, CHUNK_CSS_REG, css);
}
