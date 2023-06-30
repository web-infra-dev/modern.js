import path from 'path';
import { logger } from '@modern-js/utils';
import type { ComponentDoc } from 'react-docgen-typescript';
import { parse } from 'react-docgen-typescript';
import { apiDocMap } from './constants';
import { locales } from './locales';
import type { DocGenOptions } from './types';

export const docgen = async ({
  entries,
  languages,
  apiParseTool,
  appDir,
}: DocGenOptions) => {
  if (Object.keys(entries).length === 0) {
    return;
  }

  logger.info('[module-doc-plugin]', 'Start to generate API table...');

  Object.entries(entries).map(async ([key, value]) => {
    const moduleSourceFilePath = path.resolve(appDir, value);
    try {
      if (apiParseTool === 'documentation') {
        const documentation = await import('documentation');

        const documentationRes = await documentation.build([
          moduleSourceFilePath,
        ]);
        const apiDoc = await documentation.formats.md(documentationRes);
        apiDocMap[key] = apiDoc;
      } else {
        const componentDoc = parse(moduleSourceFilePath);
        if (componentDoc.length === 0) {
          logger.warn(
            '[module-doc-plugin]',
            `Unable to parse API document in ${moduleSourceFilePath}`,
          );
        }
        languages.forEach(language => {
          apiDocMap[`${key}-${language}`] = generateTable(
            componentDoc,
            language,
          );
        });
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          '[module-doc-plugin]',
          `Generate API table error: ${e.message}`,
        );
      }
    }
  });
  logger.success('[module-doc-plugin]', `Generate API table successfully!`);
};

function generateTable(componentDoc: ComponentDoc[], language: 'zh' | 'en') {
  return componentDoc
    .map(param => {
      const { props } = param;
      const t = locales[language];
      const PROP_TABLE_HEADER = `|${t.property}|${t.description}|${t.type}|${t.defaultValue}|\n|:---:|:---:|:---:|:---:|`;

      const tableContent = Object.keys(props)
        .filter(propName => {
          const { name, description } = props[propName];
          return (
            description ||
            ['className', 'style', 'disabled', 'children'].indexOf(name) > -1
          );
        })
        .map(propName => {
          const { defaultValue, description, name, required, type } =
            props[propName];
          const getType = () =>
            `\`${type.name.replace(/\|/g, '\\|')}\`${
              required ? ` **(${t.required})**` : ''
            }`;
          const getDefaultValue = () => `\`${defaultValue?.value || '-'}\``;

          const getDescription = () => {
            switch (name) {
              case 'className':
                return description || t.className;
              case 'style':
                return description || t.style;
              case 'children':
                return description || t.children;
              case 'disabled':
                return description || t.disabled;
              default:
                return description;
            }
          };
          return `|${[name, getDescription(), getType(), getDefaultValue()]
            .map(str => str.replace(/(?<!\\)\|/g, '&#124;'))
            .join('|')}|`;
        });

      return `
  ${param.displayName ? `### ${param.displayName}\n` : ''}
  ${param.description ? `**${param.description}**\n` : ''}
  ${PROP_TABLE_HEADER}
  ${tableContent.join('\n')}
    `;
    })
    .join('\n');
}
