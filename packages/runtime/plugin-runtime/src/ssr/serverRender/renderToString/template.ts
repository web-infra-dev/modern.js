type Filter = (str: string) => string;

const VARIABLE_REG_EXP = /<!--<\?([-=+])\s*(.*?)\s*\?>-->/;
const VARIABLE_SPLITTER = /(<!--<\?.*?\?>-->)/;

const ENCODE_HTML_RULES: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;',
};

const MATCH_HTML = /[&<>'"]/g;

function encodeChar(c: string): string {
  return ENCODE_HTML_RULES[c] || c;
}

function escape(str: string): string {
  return str.replace(MATCH_HTML, encodeChar);
}

export class Fragment {
  static filterMap: { [key: string]: Filter } = {
    '=': escape,
    '-': v => v,
  };

  isVariable: boolean;

  content: string;

  filters: Filter[];

  path: string[];

  constructor(template: string) {
    const match = VARIABLE_REG_EXP.exec(template);

    if (match) {
      const [, filterFlag, content] = match;

      this.isVariable = true;
      this.content = content;
      this.filters = [Fragment.filterMap[filterFlag]];
      this.path = content.replace(/\[['"](.*?)['"]\]/g, '.$1').split('.');
    } else {
      this.isVariable = false;
      this.content = template;
      this.filters = [];
      this.path = [];
    }
  }

  getValue(data: any) {
    if (this.isVariable) {
      const value = this.path.reduce((p, n) => (p != null ? p[n] : p), data);
      return this.filters.reduce((p, n) => n(p), value != null ? value : '');
    }

    return this.content;
  }
}

const fragmentListMap: { [key: string]: Fragment[] } = {};

export function toFragments(template: string, entryName: string): Fragment[] {
  if (fragmentListMap[entryName]) {
    return fragmentListMap[entryName];
  }

  const fragmentList = template
    .split(VARIABLE_SPLITTER)
    .filter(v => Boolean(v))
    .map(v => new Fragment(v));

  fragmentListMap[entryName] = fragmentList;

  return fragmentList;
}
