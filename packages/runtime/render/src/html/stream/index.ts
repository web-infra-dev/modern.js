import {
  createDeferredResultScript,
  subscribeDeferredResults,
} from '../deferred';
import type { DeferredResult, DeferredResultInput } from '../deferred';
import { DeferredScriptOutputCoordinator } from './coordinator';

export { DeferredScriptOutputCoordinator } from './coordinator';

export function createShellEndMarkSplitter(marker: string) {
  if (!marker) throw new Error('A shell marker must not be empty');
  const chunks: string[] = [];
  let tail = '';
  return (
    text: string,
  ): { beforeMark: string; afterMark: string } | undefined => {
    const search = tail + text;
    const index = search.indexOf(marker);
    if (index === -1) {
      chunks.push(text);
      tail = marker.length > 1 ? search.slice(-(marker.length - 1)) : '';
      return undefined;
    }
    const buffered = chunks.join('');
    return {
      beforeMark:
        buffered.slice(0, buffered.length - tail.length) +
        search.slice(0, index),
      afterMark: search.slice(index + marker.length),
    };
  };
}

export interface DocumentStreamOptions {
  /** Omit for a continuation fragment whose document already exists. */
  shell?: {
    marker: string;
    before: string;
    after: string | (() => string);
    transform?: (html: string) => string;
  };
  identifierPrefix?: string;
  nonce?: string;
  results?: readonly DeferredResultInput[];
  /** Declare independent control scripts before taking the raw-byte fast path. */
  canEnqueueScripts?: boolean;
  serializeResult?: (result: DeferredResult) => string;
  onShell?: () => void;
  onCancel?: (reason: unknown) => void;
}

/** Raw suffix held by a streaming UTF-8 decoder at the shell boundary. */
function incompleteUtf8Suffix(bytes: Uint8Array): Uint8Array | undefined {
  let index = bytes.length - 1;
  while (index >= 0 && (bytes[index] & 0xc0) === 0x80) index--;
  if (index < 0) return undefined;
  const lead = bytes[index];
  const expected = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc2 ? 2 : 1;
  return bytes.length - index < expected ? bytes.subarray(index) : undefined;
}

/**
 * Shared writer for Node, Edge and externally created React streams. Resolver
 * registration is fixed before the first byte, independently of pending state.
 */
export function createDocumentStreamWriter(
  emit: (chunk: string | Uint8Array) => void,
  options: DocumentStreamOptions,
  onError: (error: unknown) => void,
) {
  const { shell, identifierPrefix, nonce } = options;
  const results = [...(options.results || [])];
  const expectsScripts =
    results.length > 0 || Boolean(options.canEnqueueScripts);
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const split = shell ? createShellEndMarkSplitter(shell.marker) : undefined;
  let shellFinished = !shell;
  let aborted = false;
  let resultsStopped = false;
  let failed: unknown;
  let didFail = false;
  let stop!: () => void;
  const cancelled = new Promise<void>(resolve => {
    stop = resolve;
  });
  const coordinator = new DeferredScriptOutputCoordinator(emit, {
    identifierPrefix,
  });
  if (!expectsScripts) coordinator.markNoResolvers();
  if (shellFinished) coordinator.markShellFinished();
  const complete = subscribeDeferredResults(results, result => {
    if (aborted || resultsStopped) return;
    coordinator.enqueueResolver(
      options.serializeResult
        ? options.serializeResult(result)
        : createDeferredResultScript(result, { nonce }),
    );
  }).then(undefined, error => {
    if (!aborted && !resultsStopped) {
      failed = error;
      didFail = true;
      onError(error);
    }
  });

  return {
    /** Stop waiting for provider results while draining React's fallback bytes. */
    stopResults() {
      resultsStopped = true;
      stop();
    },
    enqueueScript(script: string) {
      if (!expectsScripts)
        throw new Error('Scripts must be registered before streaming');
      if (!aborted) coordinator.enqueueResolver(script);
    },
    write(chunk: Uint8Array | string) {
      if (aborted) return;
      if (didFail) throw failed;
      if (shellFinished && !expectsScripts) {
        emit(chunk);
        return;
      }
      const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      const text = decoder.decode(bytes, { stream: true });
      if (!shellFinished && shell && split) {
        const found = split(text);
        if (!found) return;
        shellFinished = true;
        options.onShell?.();
        const after =
          typeof shell.after === 'function' ? shell.after() : shell.after;
        const document = `${shell.before}${found.beforeMark}${after}`;
        coordinator.writeReact(
          shell.transform ? shell.transform(document) : document,
        );
        // Observe continuation bytes in this same chunk before releasing queued
        // results. They may open a hidden React segment or a quoted attribute.
        if (found.afterMark) coordinator.writeReact(found.afterMark);
        if (!expectsScripts) {
          const remaining = incompleteUtf8Suffix(bytes);
          if (remaining) emit(remaining);
        }
        coordinator.markShellFinished();
      } else {
        coordinator.writeReact(text);
      }
    },
    async finish() {
      if (aborted) return;
      if (!shellFinished)
        throw new Error('React stream ended before the shell marker');
      if (expectsScripts) coordinator.writeReact(decoder.decode());
      await Promise.race([complete, cancelled]);
      if (aborted) return;
      if (didFail) throw failed;
      coordinator.finish();
    },
    abort() {
      aborted = true;
      coordinator.abort();
      stop();
    },
  };
}

/** Consume an external React byte stream without owning its React lifecycle. */
export function createDocumentStream(
  stream: ReadableStream<Uint8Array | string>,
  options: DocumentStreamOptions = {},
): ReadableStream<Uint8Array> {
  return createDocumentStreamController(stream, options).stream;
}

/** Narrow control for framework error markers sharing the same safe writer. */
export function createDocumentStreamController(
  stream: ReadableStream<Uint8Array | string>,
  options: DocumentStreamOptions = {},
) {
  if (options.shell && !options.shell.marker) {
    throw new Error('A shell marker must not be empty');
  }
  const reader = stream.getReader();
  const encoder = new TextEncoder();
  let closed = false;
  let released = false;
  let writer: ReturnType<typeof createDocumentStreamWriter>;
  function release() {
    if (!released) {
      released = true;
      reader.releaseLock();
    }
  }
  const output = new ReadableStream<Uint8Array>({
    start(controller) {
      writer = createDocumentStreamWriter(
        chunk => {
          if (!closed)
            controller.enqueue(
              typeof chunk === 'string' ? encoder.encode(chunk) : chunk,
            );
        },
        options,
        error => {
          if (closed) return;
          closed = true;
          writer.abort();
          controller.error(error);
          options.onCancel?.(error);
          // The reader can already be errored with the failure reported above.
          void reader.cancel(error).then(release, release);
        },
      );
    },
    async pull(controller) {
      try {
        while (!closed && (controller.desiredSize ?? 0) > 0) {
          const { done, value } = await reader.read();
          if (closed) return;
          if (done) {
            await writer.finish();
            if (!closed) {
              closed = true;
              release();
              controller.close();
            }
            return;
          }
          writer.write(value);
        }
      } catch (error) {
        writer.abort();
        if (!closed) {
          closed = true;
          controller.error(error);
          try {
            await reader.cancel(error);
          } finally {
            release();
          }
        }
      }
    },
    async cancel(reason) {
      closed = true;
      writer.abort();
      options.onCancel?.(reason);
      try {
        await reader.cancel(reason);
      } finally {
        release();
      }
    },
  });
  return {
    stream: output,
    enqueueScript: (script: string) => writer.enqueueScript(script),
    stopResults: () => writer.stopResults(),
  };
}
