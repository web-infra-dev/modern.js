import { fs } from '@modern-js/utils';
import * as cheerio from 'cheerio';

export async function generateHtmlScripts(filepath: string) {
  const html = await fs.readFile(filepath, 'utf-8');
  return getHtmlScripts(html);
}

function getHtmlScripts(html: string) {
  const scripts: string[] = [];
  cheerio
    .load(html)('script')
    .each((_, val) => {
      const { children, attribs } = val;
      if (
        !attribs.type ||
        attribs.type === 'application/javascript' ||
        attribs.type === 'text/javascript'
      ) {
        const _scripts = (children as { data?: string }[])
          .map(child => child.data)
          .filter(Boolean) as string[];
        scripts.push(..._scripts);
      }
    });
  return scripts;
}
