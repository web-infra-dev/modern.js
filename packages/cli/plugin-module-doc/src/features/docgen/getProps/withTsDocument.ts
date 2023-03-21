import path from 'path';
import { generateMarkdown } from 'ts-document';
import { InjectPropsParams } from '.';

export default function withTsDocument(
  { attributes, moduleSourceFilePath, language }: InjectPropsParams,
  toolOptions: Record<string, string>,
) {
  const parseFiles = attributes.file ? attributes.file.split(',') : [];
  let propsTables: string[] = [];

  parseFiles.forEach(_ => {
    const entryFilePath = path.resolve(moduleSourceFilePath);
    if (entryFilePath) {
      const markdownSchema = generateMarkdown(entryFilePath, {
        lang: language,
        sourceFilesPaths: entryFilePath,
        ...toolOptions,
      });

      if (markdownSchema) {
        propsTables = propsTables.concat(
          Object.entries(markdownSchema).map(([, ms]) => ms),
        );
      }
    }
  });
  if (!propsTables.length) {
    console.warn(
      '[module-doc-plugin]',
      `No API document was parsed in ${moduleSourceFilePath}`,
    );
  }

  return propsTables.length ? propsTables.join('\n\n') : '';
}
