import { importers, resolver, handlers, parse } from 'react-docgen';
import { DocumentationObject } from 'react-docgen/dist/Documentation';
import actualNameHandler from './actualNameHandler';

const defaultHandlers = Object.values(handlers).map(handler => handler);
const importer = importers.makeFsImporter();

export default ({
  source,
  map,
  filename,
}: {
  source: string;
  map: string;
  filename: string;
}) => {
  try {
    const results = parse(
      source,
      resolver.findAllExportedComponentDefinitions,
      [...defaultHandlers, actualNameHandler],
      {
        filename,
        importer,
      },
    ) as DocumentationObject[];

    const docgen = results
      .map(result => {
        // @ts-expect-error we know actualName is added by actualNameHandler, so it exist
        const { actualName, ...docgenInfo } = result;
        if (actualName) {
          return `${actualName}.__docgenInfo=${JSON.stringify(docgenInfo)}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(';');

    return [docgen, map];
  } catch (e) {
    return null;
  }
};
