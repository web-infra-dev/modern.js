import type { ColumnShift } from '../swc/specifiers';

const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_INDEX = new Map([...BASE64].map((char, index) => [char, index]));
const INLINE_MAP =
  /(\/\/# sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,)([A-Za-z0-9+/=]+)/;

const decodeSegment = (segment: string) => {
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64_INDEX.get(char)!;
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }
    values.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0;
    shift = 0;
  }
  return values;
};

const encodeSegment = (values: number[]) =>
  values
    .map(value => {
      let rest = value < 0 ? (-value << 1) | 1 : value << 1;
      let encoded = '';
      do {
        const digit = rest & 31;
        rest >>>= 5;
        encoded += BASE64[rest ? digit | 32 : digit];
      } while (rest);
      return encoded;
    })
    .join('');

/**
 * Moves the generated columns that follow a rewritten specifier, so a map
 * emitted by tsc still points at the right code after the rewrite. Only the
 * generated column is line-relative; the other fields are left untouched.
 */
export const shiftMappings = (mappings: string, shifts: ColumnShift[]) => {
  const byLine = new Map<number, ColumnShift[]>();
  for (const shift of shifts) {
    byLine.set(shift.line, [...(byLine.get(shift.line) ?? []), shift]);
  }
  return mappings
    .split(';')
    .map((line, index) => {
      const lineShifts = byLine.get(index);
      if (!lineShifts || !line) {
        return line;
      }
      let column = 0;
      let previous = 0;
      return line
        .split(',')
        .map(segment => {
          const values = decodeSegment(segment);
          column += values[0];
          const moved =
            column +
            lineShifts
              .filter(shift => column >= shift.column)
              .reduce((sum, shift) => sum + shift.delta, 0);
          values[0] = moved - previous;
          previous = moved;
          return encodeSegment(values);
        })
        .join(',');
    })
    .join(';');
};

const shiftMapJson = (json: string, shifts: ColumnShift[]) => {
  const map = JSON.parse(json);
  map.mappings = shiftMappings(map.mappings, shifts);
  return JSON.stringify(map);
};

/** Applies the shifts to a source map file written next to the output. */
export const shiftSourceMapFile = (json: string, shifts: ColumnShift[]) =>
  shifts.length ? shiftMapJson(json, shifts) : json;

/** Applies the shifts to a map inlined by `inlineSourceMap`. */
export const shiftInlineSourceMap = (code: string, shifts: ColumnShift[]) =>
  shifts.length
    ? code.replace(
        INLINE_MAP,
        (_, prefix: string, data: string) =>
          prefix +
          Buffer.from(
            shiftMapJson(Buffer.from(data, 'base64').toString(), shifts),
          ).toString('base64'),
      )
    : code;
