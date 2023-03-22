import path from 'path';
import doctrine from 'doctrine';
import parseEsImport from 'parse-es-import';
import { fs, fastGlob } from '@modern-js/utils';

type DemoInfo = {
  content: string;
  isTS: boolean;
};

function parseRawComment(fileContent: string) {
  const commentList: any = [];
  fileContent.replace(/\/\*{2}\s*\n(\s*\*.*\n)+\s*\*\//g, match => {
    const comment: Record<string, string> = {
      kind: 'member',
    };

    doctrine
      .parse(match, { unwrap: true, recoverable: true })
      .tags.forEach(({ title, name, description }) => {
        const value = name || description;
        if (value) {
          comment[title] = value;
        }
        if (title === 'file') {
          comment.kind = 'file';
        }
      });

    commentList.push(comment);
    return fileContent;
  });

  return commentList;
}

export default function injectDemoCodes({
  demoEntries,
  markdownBody,
  placeholder,
}: {
  /** Path of demo entries */
  demoEntries: string[];
  /** Content of markdown */
  markdownBody: string;
  /** Placeholder for demos */
  placeholder: string;
}) {
  if (markdownBody.indexOf(placeholder) === -1) {
    return markdownBody;
  }
  // Single entry
  if (demoEntries.length === 1 && demoEntries[0].endsWith('js')) {
    const entryPoint = demoEntries[0];
    const entryContent = fs.readFileSync(entryPoint, 'utf8');

    // Get demo source code
    const demoInfoList: DemoInfo[] = [];
    const { exports } = parseEsImport(entryContent);

    const getDemoInfo = (moduleName: string): DemoInfo | null => {
      const validTails = [
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '/index.js',
        '/index.ts',
        '/index.jsx',
        '/index.tsx',
      ];
      const requirePath = fastGlob.sync(
        `${path.resolve(
          path.parse(entryPoint).dir,
          moduleName,
        )}{${validTails.join(',')}}`,
      )[0];
      if (requirePath) {
        return {
          content: fs.readFileSync(requirePath, 'utf8'),
          isTS: Boolean(requirePath.match(/.tsx?$/)),
        };
      }

      return null;
    };

    exports.forEach(({ type, moduleName, value }) => {
      switch (type) {
        case 'ExportSpecifier': {
          const demoInfo = getDemoInfo(value);
          demoInfo && demoInfoList.push(demoInfo);
          break;
        }
        case 'FunctionDeclaration':
          demoInfoList.push({
            content: value,
            isTS: false,
          });
          break;

        case 'VariableDeclaration':
          demoInfoList.push({
            content: `const ${moduleName} = ${value}`,
            isTS: false,
          });
          break;

        default:
          break;
      }
    });

    // Get comment
    const commentList = parseRawComment(entryContent);
    // const commentStr = `\n~~~json type=description\n${JSON.stringify(
    //   commentList,
    //   null,
    //   2,
    // )}\n~~~\n`;
    const demoStr = demoInfoList
      .map(({ content, isTS }, index) => {
        const { title, description } = commentList[index + 1];
        return `\n### ${title}\n${description} \n\n~~~${
          isTS ? 't' : 'j'
        }sx\n${content}\n~~~\n`;
      })
      .join('');
    return markdownBody.replace(placeholder, `${demoStr}`);
  }

  const demos = demoEntries.map(path => {
    const fileExt = path.split('.').pop();
    const fileContent = fs.readFileSync(path, 'utf8');
    return `\n~~~${fileExt}\n${fileContent}\n~~~\n`;
  });
  return markdownBody.replace(placeholder, demos.join(''));
}
