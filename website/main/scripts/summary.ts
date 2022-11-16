import fs from 'fs';
import path, { basename, dirname, extname } from 'path';
import { marked } from 'marked';

const walk = (dir: string) => {
  const fl: string[] = [];
  fs.readdirSync(dir).forEach(ff => {
    const fpath = path.join(dir, ff);
    if (fs.statSync(fpath).isDirectory()) {
      fl.push(...walk(fpath));
    } else if (extname(fpath) === '.md') {
      fl.push(fpath);
    }
  });
  return fl;
};

const summary = (lng: string) => {
  const fl = walk(
    path.join(
      process.cwd(),
      `./node_modules/@modern-js/builder-doc/${lng}/config`,
    ),
  );
  const json = fl.map(fpath => {
    const markdown = fs.readFileSync(fpath, 'utf-8');
    const lexer = new marked.Lexer({ async: true });
    const tokens = lexer.lex(markdown);
    const p: any = tokens.find(tk => {
      return tk.type === 'paragraph';
    });
    return {
      text: p.text,
      name: basename(fpath).replace(extname(fpath), ''),
      dirname: basename(dirname(fpath)),
    };
  });

  fs.writeFileSync(
    path.join(__dirname, `summary.${lng}.json`),
    JSON.stringify(json, null, 2),
  );
};

summary('zh');
summary('en');
