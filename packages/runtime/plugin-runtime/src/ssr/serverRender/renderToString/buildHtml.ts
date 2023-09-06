export type BuildHtmlCb = (tempalte: string) => string;

export function buildHtml(template: string, callbacks: BuildHtmlCb[]) {
  return callbacks.reduce((tmp, cb) => cb(tmp), template);
}

export function createReplaceHtml(html: string): BuildHtmlCb {
  const HTML_REG = /<!--<\?-\s*html\s*\?>-->/;
  return (template: string) => template.replace(HTML_REG, html);
}

export function createReplaceSSRDataScript(data: string): BuildHtmlCb {
  const SSR_DATA_REG = /<!--<\?-\s*SSRDataScript\s*\?>-->/;
  return (template: string) => template.replace(SSR_DATA_REG, data);
}

export function createReplaceChunkJs(js: string): BuildHtmlCb {
  const CHUNK_JS_REG = /<!--<\?-\s*chunksMap\.js\s*\?>-->/;
  return (template: string) => template.replace(CHUNK_JS_REG, js);
}

export function createReplaceChunkCss(css: string): BuildHtmlCb {
  const CHUNK_CSS_REG = /<!--<\?-\s*chunksMap\.css\s*\?>-->/;
  return (template: string) => template.replace(CHUNK_CSS_REG, css);
}
