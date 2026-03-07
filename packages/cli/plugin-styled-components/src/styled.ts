import * as styledComponents from 'styled-components';

const maybeDefault = Reflect.get(styledComponents as any, 'default');
const maybeNestedDefault = maybeDefault
  ? Reflect.get(maybeDefault as any, 'default')
  : undefined;
const styled = maybeNestedDefault ?? maybeDefault ?? styledComponents;

export default styled;
export * from 'styled-components';
