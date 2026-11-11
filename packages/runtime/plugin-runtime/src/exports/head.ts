'use client';
import { createElement } from 'react';
import { Helmet as ReactHelmet, type HelmetProps } from 'react-helmet';
import { getRequestHelmetProps } from '../core/head/requestCollector';

type HelmetComponentProps = React.PropsWithChildren<HelmetProps>;

function RequestScopedHelmet(props: HelmetComponentProps) {
  const requestHelmetProps = getRequestHelmetProps();
  if (requestHelmetProps) {
    requestHelmetProps.push(props);
    return null;
  }
  return createElement(ReactHelmet, props);
}

/**
 * Same as the `Helmet` of react-helmet. In streaming SSR the props are
 * recorded per request, see `core/head/requestCollector`.
 */
export const Helmet = Object.assign(RequestScopedHelmet, {
  peek: () => ReactHelmet.peek(),
  rewind: () => ReactHelmet.rewind(),
  renderStatic: () => ReactHelmet.renderStatic(),
  get canUseDOM() {
    return ReactHelmet.canUseDOM;
  },
  set canUseDOM(value: boolean) {
    ReactHelmet.canUseDOM = value;
  },
}) as unknown as typeof ReactHelmet;

export default Helmet;

export type {
  HelmetTags,
  HelmetProps,
  HelmetPropsToState,
  HelmetData,
  HelmetDatum,
  HelmetHTMLBodyDatum,
  HelmetHTMLElementDatum,
} from 'react-helmet';
