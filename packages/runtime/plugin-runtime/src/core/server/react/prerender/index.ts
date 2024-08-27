import React, { createElement } from 'react';
import withSideEffect from 'react-side-effect';
import type { GeneralizedProps, SprProps } from './type';
import {
  aggKeysFromPropsList,
  aggMatchesFromPropsList,
  exist,
  getOutermostProperty,
} from './util';

const PROP_NAMES = {
  INTERVAL: 'interval',
  STALE_LIMIT: 'staleLimit',
  LEVEL: 'level',
  INCLUDES: 'includes',
  EXCLUDES: 'excludes',
  FALLBACK: 'fallback',
  MATCHES: 'matches',
};

const handleClientStateChange = () => {
  // not used
};

const mapStateOnServer = (reduceProps: GeneralizedProps) => {
  const defaultProps: SprProps = {
    interval: 10,
    staleLimit: false,
    level: 0,
    includes: null,
    excludes: null,
    fallback: false,
    matches: null,
  };

  return Object.keys(defaultProps).reduce((props: SprProps, key: string) => {
    const propKey = key as keyof SprProps;
    const reduceProp = reduceProps[propKey];
    let nextProps = props;
    if (exist(reduceProp)) {
      nextProps = { ...props, [propKey]: reduceProp };
    }
    return nextProps;
  }, defaultProps);
};

const reducePropsToState = (propsList: GeneralizedProps[]) => {
  const reduceProps = {
    interval: getOutermostProperty(propsList, PROP_NAMES.INTERVAL),
    staleLimit: getOutermostProperty(propsList, PROP_NAMES.STALE_LIMIT),
    level: getOutermostProperty(propsList, PROP_NAMES.LEVEL),
    includes: aggKeysFromPropsList(propsList, PROP_NAMES.INCLUDES),
    excludes: aggKeysFromPropsList(propsList, PROP_NAMES.EXCLUDES),
    fallback: getOutermostProperty(propsList, PROP_NAMES.FALLBACK),
    matches: aggMatchesFromPropsList(propsList, PROP_NAMES.MATCHES),
  };

  return reduceProps;
};

function factory(Component: React.ComponentType<any>) {
  class Spr extends React.Component {
    static set canUseDOM(canUseDOM: boolean) {
      (Component as any).canUseDOM = canUseDOM;
    }

    static get canUseDOM() {
      return (Component as any).canUseDOM;
    }

    static peek: any = (Component as any).peek;

    static rewind: () => SprProps = (Component as any).rewind;

    static config: () => SprProps = () => {
      const mappedState: SprProps = (Component as any).rewind();
      return mappedState;
    };

    private verify() {
      return true;
    }

    public render() {
      const newProps = { ...this.props };

      const validate = this.verify();
      if (!validate) {
        throw new Error('invalid props, check usage');
      }

      if (process.env.NODE_ENV === 'development') {
        console.error(
          '[Warn] PreRender has been deprecated, please use SSR Cache instead. reference to docs: https://modernjs.dev/guides/advanced-features/ssr.html',
        );
      }

      return createElement(Component, { ...newProps });
    }
  }

  return Spr;
}

const NullComponent = () => null;
const SprSideEffects = withSideEffect(
  reducePropsToState,
  handleClientStateChange,
  mapStateOnServer,
)(NullComponent);

/**
 * @deprecated
 * The Prerender already has been deprecated, please use [SSR Cache](https://modernjs.dev/guides/advanced-features/ssr.html) instead.
 */
export const PreRender: any = factory(SprSideEffects);
