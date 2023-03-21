import { APIParseTools, ModuleDocgenLanguage } from '../../../types';
import withReactDocgen from './withReactDocgen';
import withTsDocument from './withTsDocument';

export interface InjectPropsParams {
  /** Path of current component */
  moduleSourceFilePath: string;
  /** Attributes of template markdown */
  attributes: Record<string, string>;
  /** Target language */
  language: ModuleDocgenLanguage;
}

export default function getProps(
  tsParseTool: APIParseTools,
  toolOptions: Record<string, string>,
  options: InjectPropsParams,
) {
  if (tsParseTool === 'ts-document') {
    return withTsDocument(options, toolOptions);
  }

  return withReactDocgen(options);
}
