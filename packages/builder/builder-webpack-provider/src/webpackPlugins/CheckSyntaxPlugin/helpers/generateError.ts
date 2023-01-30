import { AcornParseError, SyntaxError } from './type';
import { SourceMapConsumer } from 'source-map';
import { fs } from '@modern-js/utils';

export async function generateError({
  err,
  filepath,
  code,
}: {
  err: AcornParseError;
  filepath: string;
  code: string;
}) {
  let error = await tryGenerateErrorFromSourceMap(err, filepath);

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

  return error;
}

async function tryGenerateErrorFromSourceMap(
  err: AcornParseError,
  filepath: string,
): Promise<SyntaxError | null> {
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

    const path = sm.source.replace('webpack://', '');
    const rawLines = smContent.split(/\r?\n/g);

    return new SyntaxError(err.message, {
      source: {
        path,
        line: sm.line ?? 0,
        column: sm.column ?? 0,
        code: rawLines[(sm.line ?? 0) - 1].trim(),
      },
      output: {
        path: filepath,
        line: err.loc.line,
        column: err.loc.column,
      },
    });
  } catch (e) {
    return null;
  }
}
