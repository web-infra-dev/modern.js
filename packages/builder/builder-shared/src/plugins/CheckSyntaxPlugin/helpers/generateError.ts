import { AcornParseError, CheckSyntaxExclude, SyntaxError } from './type';
import { SourceMapConsumer } from 'source-map';
import { chalk, fs } from '@modern-js/utils';
import { checkIsExcludeSource } from './utils';

export async function generateError({
  err,
  code,
  filepath,
  rootPath,
  exclude,
}: {
  err: AcornParseError;
  code: string;
  filepath: string;
  rootPath: string;
  exclude?: CheckSyntaxExclude;
}) {
  let error = await tryGenerateErrorFromSourceMap({
    err,
    filepath,
    rootPath,
  });

  if (!error) {
    const SUB_LEN = 25;
    const path = filepath.replace(process.cwd(), '');
    error = new SyntaxError(err.message, {
      source: {
        path,
        line: err.loc.line,
        column: err.loc.column,
        code: code.substring(err.pos - SUB_LEN, err.pos + SUB_LEN).trim(),
      },
    });
  }

  if (checkIsExcludeSource(error.source.path, exclude)) {
    return null;
  }

  return error;
}

function makeCodeFrame(lines: string[], highlightLine: number) {
  const startLine = Math.max(highlightLine - 3, 0);
  const endLine = Math.min(highlightLine + 4, lines.length - 1);
  const ret: string[] = [];

  for (let i = startLine; i < endLine; i++) {
    if (i === highlightLine) {
      const lineNumber = `> ${i + 1}`.padStart(6, ' ');
      ret.push(chalk.yellow(`${lineNumber} | ${lines[i]}`));
    } else {
      const lineNumber = ` ${i + 1}`.padStart(6, ' ');
      ret.push(chalk.gray(`${lineNumber} | ${lines[i]}`));
    }
  }

  return `\n${ret.join('\n')}`;
}

async function tryGenerateErrorFromSourceMap({
  err,
  filepath,
  rootPath,
}: {
  err: AcornParseError;
  filepath: string;
  rootPath: string;
}): Promise<SyntaxError | null> {
  const sourceMapPath = `${filepath}.map`;
  if (!fs.existsSync(sourceMapPath)) {
    return null;
  }

  try {
    const sourcemap = await fs.readFile(sourceMapPath, 'utf-8');
    const consumer = await new SourceMapConsumer(sourcemap);
    const sm = consumer.originalPositionFor({
      line: err.loc.line,
      column: err.loc.column,
    });
    if (!sm.source) {
      return null;
    }
    const { sources } = consumer;

    const smIndex = sources.indexOf(sm.source);

    const smContent: string = JSON.parse(sourcemap)?.sourcesContent?.[smIndex];

    if (!smContent) {
      return null;
    }

    const path = sm.source.replace(/webpack:\/\/(tmp)?/g, '');
    const relativeFilepath = filepath.replace(rootPath, '');

    const rawLines = smContent.split(/\r?\n/g);
    const highlightLine = (sm.line ?? 1) - 1;

    return new SyntaxError(err.message, {
      source: {
        path,
        line: sm.line ?? 0,
        column: sm.column ?? 0,
        code: makeCodeFrame(rawLines, highlightLine),
      },
      output: {
        path: relativeFilepath,
        line: err.loc.line,
        column: err.loc.column,
      },
    });
  } catch (e) {
    return null;
  }
}
