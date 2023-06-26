/**
 * Copyright JS Foundation and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/jantimon/html-webpack-plugin/blob/main/LICENSE
 *
 * Modified from https://github.com/jantimon/html-webpack-plugin/blob/2f5de7ab9e8bca60e9e200f2e4b4cfab90db28d4/index.js#L800
 */
export type MetaAttributes = { [attributeName: string]: string | boolean };

export interface MetaOptions {
  [name: string]:
    | string
    | false // name content pair e.g. {viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no'}`
    | MetaAttributes; // custom properties e.g. { name:"viewport" content:"width=500, initial-scale=1" }
}

const tagObjectToString = (tagDefinition: {
  tagName: string;
  voidTag: boolean;
  attributes: MetaAttributes;
  innerHTML?: string;
}) => {
  const attributes = Object.keys(tagDefinition.attributes || {})
    .filter(attributeName => tagDefinition.attributes[attributeName] !== false)
    .map(attributeName => {
      if (tagDefinition.attributes[attributeName] === true) {
        return attributeName;
      }
      return `${attributeName}="${
        tagDefinition.attributes[attributeName] as string
      }"`;
    });
  return `<${[tagDefinition.tagName].concat(attributes).join(' ')}>${
    tagDefinition.innerHTML || ''
  }${tagDefinition.voidTag ? '' : `</${tagDefinition.tagName}>`}`;
};

export const generateMetaTags = (metaOptions?: MetaOptions): string => {
  if (!metaOptions) {
    return '';
  }
  // Make tags self-closing in case of xhtml
  // Turn { "viewport" : "width=500, initial-scale=1" } into
  // [{ name:"viewport" content:"width=500, initial-scale=1" }]
  const metaTagAttributeObjects = Object.keys(metaOptions)
    .map(metaName => {
      const metaTagContent = metaOptions[metaName];
      return typeof metaTagContent === 'string'
        ? {
            name: metaName,
            content: metaTagContent,
          }
        : metaTagContent;
    })
    .filter(attribute => attribute !== false);
  // Turn [{ name:"viewport" content:"width=500, initial-scale=1" }] into
  // the html-webpack-plugin tag structure
  return metaTagAttributeObjects
    .map(metaTagAttributes => {
      if (metaTagAttributes === false) {
        throw new Error('Invalid meta tag');
      }
      return {
        tagName: 'meta',
        voidTag: true,
        attributes: metaTagAttributes,
      };
    })
    .reduce(
      (memo, tagObject) => `${memo}\n${tagObjectToString(tagObject)}`,
      '',
    );
};
