import assert from 'assert';

export const mergeRegex = (...regexes: (string | RegExp)[]): RegExp => {
  assert(
    regexes.length,
    'mergeRegex: regular expression array should not be empty.',
  );
  const sources = regexes.map(regex =>
    regex instanceof RegExp ? regex.source : regex,
  );

  return new RegExp(sources.join('|'));
};

export function getRegExpForExts(extensions: string[]): RegExp {
  return new RegExp(
    `\\.(${extensions
      .map(ext => ext.trim())
      .map(ext => (ext.startsWith('.') ? ext.slice(1) : ext))
      .join('|')})$`,
    'i',
  );
}
