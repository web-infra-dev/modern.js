// 用于 react-helmet 正则替换
import { HelmetData } from 'react-helmet';

const RE_HTML_ATTR = /<html[^>]*>/;
const RE_BODY_ATTR = /<body[^>]*>/;
const RE_LAST_IN_HEAD = /<\/head>/;
const RE_TITLE = /<title[^>]*>([\s\S\n\r]*?)<\/title>/;

// 通过 react-helmet 修改模板
export default function helmet(content: string, helmetData: HelmetData) {
  let result = content;
  const bodyAttributes = helmetData.bodyAttributes.toString();
  if (bodyAttributes) {
    result = result.replace(RE_BODY_ATTR, `<body ${bodyAttributes}>`);
  }

  const htmlAttributes = helmetData.htmlAttributes.toString();
  if (htmlAttributes) {
    result = result.replace(RE_HTML_ATTR, `<html ${htmlAttributes}>`);
  }

  const base = helmetData.base.toString();
  const link = helmetData.link.toString();
  const meta = helmetData.meta.toString();
  const noscript = helmetData.noscript.toString();
  const script = helmetData.script.toString();
  const style = helmetData.style.toString();
  const title = helmetData.title.toString();

  // helmetData 中是否有写 title 标签，有的话替换模板中的 title
  const hasHelmetTitle = RE_TITLE.exec(title);
  if (hasHelmetTitle?.[1]) {
    result = result.replace(RE_TITLE, title);
  }

  return result.replace(
    RE_LAST_IN_HEAD,
    `
    ${base}
    ${link}
    ${meta}
    ${noscript}
    ${script}
    ${style}
    ${title}
    </head>
  `,
  );
}
