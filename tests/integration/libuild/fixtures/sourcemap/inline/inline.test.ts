import fs from 'fs';
import path from 'path';
import { expect, getLibuilderTest } from '@/toolkit';
import { SourceMapConsumer } from 'source-map';
import convertSourceMap from 'convert-source-map';
import assert from 'assert';

describe('fixture:sourcemap', () => {
  it('should work when sourcemap is `inline`', async () => {
    const bundler = await getLibuilderTest({ root: __dirname, sourceMap: 'inline' });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.entries(jsOutput);
    expect(jsChunk.length).equal(1);
    const outputFile = jsChunk[0][0];
    const outputMapFile = `${outputFile}.map`;
    expect(fs.existsSync(outputMapFile)).to.be.false;
    expect(fs.readFileSync(outputFile).toString('utf-8')).include(
      '//# sourceMappingURL=data:application/json;charset=utf-8;base64,'
    );
  });

  it('sourcemap should be effective', async () => {
    let rawOutputJsMap = null;
    const bundler = await getLibuilderTest({
      root: __dirname,
      sourceMap: 'inline',
      plugins: [
        {
          name: 'sourcemap-verify',
          apply(compiler) {
            compiler.hooks.endCompilation.tapPromise(
              {
                stage: 1,
                name: 'sourcemap-verify',
              },
              async () => {
                for (const [key, value] of compiler.outputChunk.entries()) {
                  if (key.endsWith('.js') && value.type === 'chunk') {
                    const jsContent = value.contents;
                    const jsMap = value.map;
                    rawOutputJsMap = jsMap;
                    const { entryPoint } = value;
                    if (!entryPoint || !jsMap) {
                      throw Error('expected entryPoint and jsMap');
                    }

                    const smc = await new SourceMapConsumer(jsMap as any);
                    const relativePath = path.relative(path.resolve(key, '..'), entryPoint);

                    const sourceContent = smc.sourceContentFor(relativePath);
                    if (!sourceContent) {
                      throw Error('expected sourceContent file');
                    }
                    const origLocation = getLocation(sourceContent, 'sourcemap stub');
                    const dstLocation = getLocation(jsContent, 'sourcemap stub');
                    const recoverLocation = smc.originalPositionFor(dstLocation);
                    if (!recoverLocation.line || !recoverLocation.column || recoverLocation.column === 1) {
                      throw Error('wrong sourcemap');
                    }
                    expect(Math.abs(recoverLocation.line - origLocation.line), 'recover line wrong').lessThanOrEqual(1);
                    expect(
                      Math.abs(recoverLocation.column - origLocation.column),
                      'recover column wrong'
                    ).lessThanOrEqual(1);
                  }
                }
              }
            );
          },
        },
      ],
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.entries(jsOutput);
    const outputFile = jsChunk[0][0];
    const code = fs.readFileSync(outputFile, 'utf-8');
    const outputJsMap = convertSourceMap.fromSource(code)?.toObject();
    expect(outputJsMap).deep.equals(rawOutputJsMap);
    const consumer = await new SourceMapConsumer(outputJsMap);
    const sourceCode = fs.readFileSync(path.resolve(__dirname, './index.ts'), 'utf-8');
    const stubs = ['function', 'console.debug', 'console.log'];
    const orig = [];
    const dst = [];
    for (const [i, stub] of stubs.entries()) {
      orig[i] = getLocation(sourceCode, stub);
      dst[i] = getLocation(code, stub);
      const remappingPos = consumer.originalPositionFor(dst[i]);
      assert.deepStrictEqual(orig[i].column, remappingPos.column);
      assert.deepStrictEqual(orig[i].line, remappingPos.line);
    }
  });
});
interface Position {
  line: number;
  column: number;
}
function getLocation(source: string, search: string): Position {
  const lines = source.split('\n');
  const len = lines.length;

  let lineStart = 0;
  let i;

  const charIndex = typeof search === 'number' ? search : source.indexOf(search);

  for (i = 0; i < len; i += 1) {
    const line = lines[i];
    const lineEnd = lineStart + line.length + 1; // +1 for newline

    if (lineEnd > charIndex) {
      return { line: i + 1, column: charIndex - lineStart };
    }

    lineStart = lineEnd;
  }

  throw new Error('Could not determine location of character');
}
