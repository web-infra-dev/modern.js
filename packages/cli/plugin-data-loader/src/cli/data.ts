/* eslint-disable node/prefer-global/text-decoder */
/* eslint-disable node/prefer-global/text-encoder */
/* eslint-disable max-depth */
/**
 * modified from https://github.com/remix-run/remix/blob/main/packages/remix-react/data.ts
 * license at https://github.com/remix-run/remix/blob/main/LICENSE.md
 */
import {
  UNSAFE_DeferredData as DeferredData,
  AbortedDeferredError,
} from '@modern-js/utils/remix-router';

const DEFERRED_VALUE_PLACEHOLDER_PREFIX = '__deferred_promise:';
export async function parseDeferredReadableStream(
  stream: ReadableStream<Uint8Array>,
): Promise<DeferredData> {
  if (!stream) {
    throw new Error('parseDeferredReadableStream requires stream argument');
  }

  let deferredData: Record<string, Promise<unknown>> | undefined;
  const deferredResolvers: Record<
    string,
    { resolve: (data: unknown) => void; reject: (error: unknown) => void }
  > = {};

  try {
    const sectionReader = readStreamSections(stream);

    // Read the first section to get the critical data
    const initialSectionResult = await sectionReader.next();
    const initialSection = initialSectionResult.value;
    if (!initialSection) {
      throw new Error('no critical data');
    }
    const criticalData = JSON.parse(initialSection);

    // Setup deferred data and resolvers for later based on the critical data
    if (typeof criticalData === 'object' && criticalData !== null) {
      for (const [eventKey, value] of Object.entries(criticalData)) {
        if (
          typeof value !== 'string' ||
          !value.startsWith(DEFERRED_VALUE_PLACEHOLDER_PREFIX)
        ) {
          continue;
        }

        deferredData = deferredData || {};

        deferredData[eventKey] = new Promise<any>((resolve, reject) => {
          deferredResolvers[eventKey] = {
            resolve: (value: unknown) => {
              resolve(value);
              delete deferredResolvers[eventKey];
            },
            reject: (error: unknown) => {
              reject(error);
              delete deferredResolvers[eventKey];
            },
          };
        });
      }
    }

    // Read the rest of the stream and resolve deferred promises
    (async () => {
      try {
        for await (const section of sectionReader) {
          // Determine event type and data
          const [event, ...sectionDataStrings] = section.split(':');
          const sectionDataString = sectionDataStrings.join(':');
          const data = JSON.parse(sectionDataString);

          if (event === 'data') {
            for (const [key, value] of Object.entries(data)) {
              if (deferredResolvers[key]) {
                deferredResolvers[key].resolve(value);
              }
            }
          } else if (event === 'error') {
            for (const [key, value] of Object.entries(data) as Iterable<
              [string, { message: string; stack?: string }]
            >) {
              const err = new Error(value.message);
              err.stack = value.stack;
              if (deferredResolvers[key]) {
                deferredResolvers[key].reject(err);
              }
            }
          }
        }

        for (const [key, resolver] of Object.entries(deferredResolvers)) {
          resolver.reject(
            new AbortedDeferredError(`Deferred ${key} will never resolved`),
          );
        }
      } catch (error) {
        // Reject any existing deferred promises if something blows up
        for (const resolver of Object.values(deferredResolvers)) {
          resolver.reject(error);
        }
      }
    })();

    return new DeferredData({ ...criticalData, ...deferredData });
  } catch (error) {
    for (const resolver of Object.values(deferredResolvers)) {
      resolver.reject(error);
    }

    throw error;
  }
}

async function* readStreamSections(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();

  let buffer: Uint8Array[] = [];
  let sections: string[] = [];
  let closed = false;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readStreamSection = async () => {
    if (sections.length > 0) {
      return sections.shift();
    }

    // Read from the stream until we have at least one complete section to process
    while (!closed && sections.length === 0) {
      const chunk = await reader.read();
      if (chunk.done) {
        closed = true;
        break;
      }
      // Buffer the raw chunks
      buffer.push(chunk.value);

      try {
        // Attempt to split off a section from the buffer
        const bufferedString = decoder.decode(mergeArrays(...buffer));
        const splitSections = bufferedString.split('\n\n');
        if (splitSections.length >= 2) {
          // We have a complete section, so add it to the sections array
          sections.push(...splitSections.slice(0, -1));
          // Remove the section from the buffer and store the rest for future processing
          buffer = [encoder.encode(splitSections.slice(-1).join('\n\n'))];
        }

        // If we successfully parsed at least one section, break out of reading the stream
        // to allow upstream processing of the processable sections
        if (sections.length > 0) {
          break;
        }
      } catch {
        // If we failed to parse the buffer it was because we failed to decode the stream
        // because we are missing bytes that we haven't yet received, so continue reading
        // from the stream until we have a complete section
        continue;
      }
    }

    // If we have a complete section, return it
    if (sections.length > 0) {
      return sections.shift();
    }

    // If we have no complete section, but we have no more chunks to process,
    // split those sections and clear out the buffer as there is no more data
    // to process. If this errors, let it bubble up as the stream ended
    // without valid data
    if (buffer.length > 0) {
      const bufferedString = decoder.decode(mergeArrays(...buffer));
      sections = bufferedString.split('\n\n').filter(s => s);
      buffer = [];
    }

    // Return any remaining sections that have been processed
    return sections.shift();
  };

  let section = await readStreamSection();
  while (section) {
    yield section;
    section = await readStreamSection();
  }
}

function mergeArrays(...arrays: Uint8Array[]) {
  const out = new Uint8Array(
    arrays.reduce((total, arr) => total + arr.length, 0),
  );
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}
/* eslint-enable max-depth */
/* eslint-enable node/prefer-global/text-decoder */
/* eslint-enable node/prefer-global/text-encoder */
