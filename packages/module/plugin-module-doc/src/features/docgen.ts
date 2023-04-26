import path from 'path';
import { logger } from '@modern-js/utils';
import type { ComponentDoc } from 'react-docgen-typescript';
import { withDefaultConfig } from 'react-docgen-typescript';
import type { ModuleDocgenLanguage, Options } from '../types';
import { PropsMarkdownMap } from '../constants';
import { locales } from '../locales';

export const docgen = async ({
  entries,
  appDir,
  languages,
}: Required<Options>) => {
  if (Object.keys(entries).length === 0) {
    return;
  }

  logger.info('[module-doc-plugin]', 'Start to generate API table...');

  const { parse } = withDefaultConfig({
    propFilter: prop =>
      prop.parent == null ||
      prop.parent.fileName.indexOf('node_modules/@types/react') < 0,
  });

  Object.entries(entries).map(async ([key, value]) => {
    const generateDocStr = async (language: ModuleDocgenLanguage) => {
      const moduleSourceFilePath = path.resolve(appDir, value);
      const defaultLang = languages[0];
      try {
        const componentDoc = parse(moduleSourceFilePath);
        if (componentDoc.length === 0) {
          logger.warn(
            '[module-doc-plugin]',
            `Unable to parse API document in ${moduleSourceFilePath}`,
          );
        } else {
          const param = componentDoc[0];
          const PropsMarkdown = generateTable(param, language);
          const suffix = language === defaultLang ? '' : `-${language}`;
          PropsMarkdownMap.set(`${key}${suffix}`, PropsMarkdown);
        }
      } catch (e) {
        if (e instanceof Error) {
          logger.error(
            '[module-doc-plugin]',
            `Generate API table error: ${e.message}`,
          );
        }
      }
    };
    await Promise.all(languages.map(lang => generateDocStr(lang)));
  });
  logger.success('[module-doc-plugin]', `Generate API table successfully!`);
};

function generateTable(param: ComponentDoc, language: ModuleDocgenLanguage) {
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
${param.description ? `\n${param.description}\n` : ''}
${PROP_TABLE_HEADER}
${tableContent.join('\n')}
  `;
}
