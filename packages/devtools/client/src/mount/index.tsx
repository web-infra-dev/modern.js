import { createRoot } from 'react-dom/client';
import { parseQuery } from 'ufo';
import _ from 'lodash';
import { SetupClientParams } from '@modern-js/devtools-kit';
import DevtoolsAction from './components/Devtools/Action';

// @ts-expect-error
const { container, resourceQuery } = window._modern_js_devtools_app;
const root = createRoot(container);
const parsed = parseQuery(resourceQuery);
if (
  !_.isString(parsed.dataSource) ||
  !_.isString(parsed.def) ||
  !_.isString(parsed.endpoint)
) {
  throw new TypeError(
    `Failed to parse client definitions of devtools: ${resourceQuery}`,
  );
}
const options: SetupClientParams = {
  dataSource: parsed.dataSource,
  endpoint: parsed.endpoint,
  def: JSON.parse(parsed.def),
};
root.render(<DevtoolsAction {...options} />);
