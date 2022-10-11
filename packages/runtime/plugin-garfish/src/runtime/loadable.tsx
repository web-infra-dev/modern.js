// logical reference to https://github.com/jamiebuilds/react-loadable/blob/6201c5837b212d6244c57f3748f2b1375096beeb/src/index.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@modern-js/plugin-router-legacy';
import { logger } from '../util';
import { LoadableConfig, MicroComponentProps } from './useModuleApps';

interface SetLoadingState {
  isLoading?: boolean;
  error?: unknown;
}

interface LoadableState {
  error: any;
  pastDelay: boolean;
  timedOut: boolean;
  isLoading: boolean;
}

export interface MicroProps extends RouteComponentProps {
  setLoadingState: (state: { isLoading?: boolean; error?: unknown }) => void;
  [key: string]: any;
}

const DEFAULT_LOADABLE = {
  delay: 200,
  timeout: 10000,
  loading: null,
};

export function Loadable(WrapComponent: any) {
  return function (defaultLoadable?: LoadableConfig) {
    return function Lodable(props: MicroComponentProps) {
      const { loadable = defaultLoadable ?? DEFAULT_LOADABLE, ...otherProps } =
        props;

      const mountRef = useRef(false);
      let delayTimer: NodeJS.Timer | null = null;
      let timeoutTimer: NodeJS.Timer | null = null;

      const [state, setState] = useState<LoadableState>(() => {
        const { delay, timeout } = loadable;
        const initState = {
          error: null,
          pastDelay: false,
          timedOut: false,
          isLoading: false,
        };

        if (typeof delay === 'number') {
          if (delay === 0) {
            initState.pastDelay = true;
          } else {
            delayTimer = setTimeout(() => {
              setStateWithMountCheck({ pastDelay: true });
            }, delay);
          }
        }

        if (typeof timeout === 'number') {
          timeoutTimer = setTimeout(() => {
            setStateWithMountCheck({ timedOut: true });
          }, timeout);
        }

        return initState;
      });

      const LoadingComponent = props.loadable?.loading;

      useEffect(() => {
        mountRef.current = true;

        logger('Loadable render state', {
          state,
          props: otherProps,
          loadable,
          defaultLoadable,
        });

        return () => {
          mountRef.current = false;
          setStateWithMountCheck({
            isLoading: false,
            error: null,
          });
          if (delayTimer) {
            clearTimeout(delayTimer);
            delayTimer = null;
          }
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
          }
        };
      }, []);

      const retry = useCallback(() => {
        setState({
          ...state,
          error: null,
          isLoading: true,
          timedOut: false,
        });
      }, [state]);

      const setStateWithMountCheck = useCallback(
        (newState: Partial<LoadableState>) => {
          if (!mountRef.current) {
            return;
          }
          setState(state => ({ ...state, ...newState }));
        },
        [state],
      );

      const showLoading = (state.isLoading || state.error) && LoadingComponent;

      return (
        <>
          {showLoading && (
            <LoadingComponent
              isLoading={state.isLoading}
              pastDelay={state.pastDelay}
              timedOut={state.timedOut}
              error={state?.error}
              retry={retry}
            />
          )}
          <WrapComponent
            style={{ display: showLoading ? 'none' : 'block' }}
            setLoadingState={(props: SetLoadingState) => {
              // loading is not provided and there is a rendering exception
              if (props.error && !LoadingComponent) {
                throw props.error;
              }
              setStateWithMountCheck(props);
            }}
            {...otherProps}
          />
        </>
      );
    };
  };
}
