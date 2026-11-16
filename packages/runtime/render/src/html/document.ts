export interface DocumentSlot {
  placeholder: string | RegExp;
  content: string;
}

export interface DocumentOptions {
  app: DocumentSlot;
  data?: DocumentSlot[];
  assets?: DocumentSlot[];
  helmet?: (template: string) => string;
  /** Preserve callers whose first document title may belong to the app. */
  appFirst?: boolean;
}

export function replaceHtml(
  template: string,
  placeholder: string | RegExp,
  content: string,
): string {
  return template.replace(placeholder, () => content);
}

/**
 * Finish template-sized edits before inserting potentially large app/data
 * payloads. Mark slots first so injected content cannot capture another slot.
 */
export function renderDocument(
  template: string,
  { app, data = [], assets = [], helmet, appFirst = false }: DocumentOptions,
): string {
  if (appFirst) {
    let html = replaceHtml(template, app.placeholder, app.content);
    for (const slot of [...assets, ...data]) {
      html = replaceHtml(html, slot.placeholder, slot.content);
    }
    return helmet ? helmet(html) : html;
  }

  const slots = [app, ...data];
  const markerId = Math.random().toString(36).slice(2);
  const markers = slots.map((_, index) => `<!--render-${markerId}-${index}-->`);
  let html = template;
  slots.forEach((slot, index) => {
    html = replaceHtml(html, slot.placeholder, markers[index]);
  });
  for (const slot of assets) {
    html = replaceHtml(html, slot.placeholder, slot.content);
  }
  if (helmet) html = helmet(html);
  // Data goes in before the app, matching the default Modern assembly order.
  for (let index = slots.length - 1; index >= 0; index--) {
    html = replaceHtml(html, markers[index], slots[index].content);
  }
  return html;
}

export interface HelmetPart {
  toString(): string;
}

export interface DocumentHelmet {
  bodyAttributes: HelmetPart;
  htmlAttributes: HelmetPart;
  base: HelmetPart;
  link: HelmetPart;
  meta: HelmetPart;
  noscript: HelmetPart;
  script: HelmetPart;
  style: HelmetPart;
  title: HelmetPart;
}

const TITLE = /<title[^>]*>([\s\S\n\r]*?)<\/title>/;
const TITLE_CONTENT = /<title[^>]*>[\s\S\n\r]*?\S[\s\S\n\r]*?<\/title>/;

export function hasTitleTagBefore(html: string, index: number): boolean {
  const match = TITLE.exec(html);
  return match !== null && match.index < index;
}

export function applyDocumentHelmet(
  html: string,
  helmet: DocumentHelmet,
  {
    format = 'spaced',
    newline = '\n',
    replacement = 'literal',
  }: {
    format?: 'spaced' | 'lines';
    newline?: string;
    replacement?: 'literal' | 'pattern';
  } = {},
): string {
  let result = html;
  const replace =
    replacement === 'pattern'
      ? (html: string, pattern: RegExp, value: string) =>
          html.replace(pattern, value)
      : replaceHtml;
  for (const [tag, attributes] of [
    ['body', helmet.bodyAttributes],
    ['html', helmet.htmlAttributes],
  ] as const) {
    const value = attributes.toString();
    if (value)
      result = replace(
        result,
        new RegExp(`<${tag}[^>]*>`),
        `<${tag} ${value}>`,
      );
  }
  const exists = TITLE.test(html);
  const title = helmet.title.toString();
  if (exists && TITLE_CONTENT.test(title.trim())) {
    result = replace(result, TITLE, title);
  }
  const tags = [
    helmet.base,
    helmet.link,
    helmet.meta,
    helmet.noscript,
    helmet.script,
    helmet.style,
  ].map(part => part.toString());
  tags.push(exists ? '' : title);
  const headEnd =
    format === 'lines'
      ? `${tags.join('\n')}\n</head>`.trim()
      : `${tags
          .filter(Boolean)
          .map(tag => `  ${tag}${newline}`)
          .join('')}</head>`;
  return replace(result, /<\/head>/, headEnd);
}
