import { BuildFailure, Message } from 'esbuild';
import { SourceMapConsumer } from 'source-map';
import { promises as fs } from 'fs';
import errorParse from 'error-stack';
import { transformData } from './registerConfigLoader';
import type { IConfigLoaderMessage } from '../types';

export function getRequireResult(data: any) {
  let result = data;

  if (result && typeof result === 'object' && 'default' in result) {
    result = result.default || {};
  }

  return result || {};
}

function isBuildFailure(err: any): err is BuildFailure {
  return typeof err === 'object' && 'errors' in err && 'warnings' in err;
}

async function parseNormalError(err: Error): Promise<IConfigLoaderMessage> {
  const parsed = errorParse(err.stack);
  const errorMessage = `${parsed.type}: ${err.message}`;
  const trace = parsed.traces.find((trace: any) => transformData.has(trace.source));

  if (!trace) {
    return {
      message: errorMessage,
    };
  }

  const cache = transformData.get(trace.source)!;
  const line = Number.parseInt(trace.line, 10);
  const column = Number.parseInt(trace.col, 10);

  try {
    if (!cache.sourceMap) {
      cache.sourceMap = await new SourceMapConsumer(JSON.parse(cache.rawSourceMap));
    }

    const originLocation = cache.sourceMap.originalPositionFor({
      line,
      column,
    });

    return {
      message: errorMessage,
      location: {
        file: cache.filePath,
        source: cache.fileContent,
        line: originLocation.line ?? undefined,
        column: originLocation.column ? originLocation.column + 1 : undefined,
      },
    };
  } catch (e: any) {
    return {
      message: errorMessage,
    };
  }
}

async function parseEsbuildError(data: Message): Promise<IConfigLoaderMessage> {
  const { location, text } = data;

  if (!location) {
    return {
      message: text,
    };
  }

  const { file, line, column, length } = location;
  const transformCache = transformData.get(file);

  if (!transformCache) {
    return {
      message: text,
      location: {
        file,
        line,
        column,
        length,
        source: await fs.readFile(file, 'utf-8'),
      },
    };
  }

  try {
    if (!transformCache.sourceMap) {
      transformCache.sourceMap = await new SourceMapConsumer(JSON.parse(transformCache.rawSourceMap));
    }

    const originLocation = transformCache.sourceMap.originalPositionFor({
      line: line - 1,
      column,
      bias: 0,
    });

    return {
      message: text,
      location: {
        file,
        length,
        line: originLocation.line ?? undefined,
        column: originLocation.column ? originLocation.column + 1 : undefined,
        source: transformCache.fileContent,
      },
    };
  } catch (e: any) {
    return {
      message: text,
      location: {
        file,
        line,
        column,
        length,
        source: await fs.readFile(file, 'utf-8'),
      },
    };
  }
}

export async function parseError(err: Error): Promise<IConfigLoaderMessage[]> {
  if (isBuildFailure(err)) {
    return Promise.all(err.errors.map(parseEsbuildError));
  }

  return [await parseNormalError(err)];
}

export async function getTransformWarnings(): Promise<IConfigLoaderMessage[]> {
  const warnings = Array.from(transformData.values())
    .filter((data) => data.warnings.length > 0)
    .reduce<Message[]>((ans, item) => ans.concat(item.warnings), []);

  return Promise.all(warnings.map(parseEsbuildError));
}
