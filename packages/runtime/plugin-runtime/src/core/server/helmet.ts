import type { HelmetData } from 'react-helmet';
import { safeReplace } from './utils';

const RE_HTML_ATTR = /<html[^>]*>/;
const RE_BODY_ATTR = /<body[^>]*>/;
const RE_LAST_IN_HEAD = /<\/head>/;
const RE_TITLE = /<title[^>]*>([\s\S\n\r]*?)<\/title>/;
const TEST_TITLE_CONTENT =
  /(?<=<title[^>]*>)([\s\S\n\r]*?)([.|\S])([\s\S\n\r]*?)(?=<\/title>)/;

export function createReplaceHelemt(helmetData?: HelmetData) {
  return helmetData
    ? (template: string) => helmetReplace(template, helmetData)
    : (tempalte: string) => tempalte;
}

// 通过 react-helmet 修改模板
export function helmetReplace(content: string, helmetData: HelmetData) {
  let result = content;
  const bodyAttributes = helmetData.bodyAttributes.toString();
  if (bodyAttributes) {
    result = safeReplace(result, RE_BODY_ATTR, `<body ${bodyAttributes}>`);
  }

  const htmlAttributes = helmetData.htmlAttributes.toString();
  if (htmlAttributes) {
    result = safeReplace(result, RE_HTML_ATTR, `<html ${htmlAttributes}>`);
  }

  const base = helmetData.base.toString();
  const link = helmetData.link.toString();
  const meta = helmetData.meta.toString();
  const noscript = helmetData.noscript.toString();
  const script = helmetData.script.toString();
  const style = helmetData.style.toString();
  const title = helmetData.title.toString();

  // 如果模板中存在 title，且 helmetData title 有内容则做替换
  const existTitleTag = RE_TITLE.test(content);
  const shouldReplaceTitle =
    existTitleTag && TEST_TITLE_CONTENT.test(title.trim());
  if (shouldReplaceTitle) {
    result = safeReplace(result, RE_TITLE, title);
  }

  const helmetStr = [
    base,
    link,
    meta,
    noscript,
    script,
    style,
    !existTitleTag ? title : '',
  ].reduce((pre, cur) => {
    return pre + (cur.length > 0 ? `  ${cur}\n` : '');
  }, '');

  return safeReplace(result, RE_LAST_IN_HEAD, `${helmetStr}</head>`);
}
