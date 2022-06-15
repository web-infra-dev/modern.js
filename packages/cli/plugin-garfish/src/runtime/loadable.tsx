// logical reference to https://github.com/jamiebuilds/react-loadable/blob/6201c5837b212d6244c57f3748f2b1375096beeb/src/index.js
import React from 'react';
import { RouteComponentProps } from '@modern-js/plugin-router';
import { logger } from '../util';
import { LoadableConfig, MicroComponentProps } from './useModuleApps';

interface SetLoadingState {
  isLoading?: boolean;
  error?: unknown;
}

export interface MicroProps extends RouteComponentProps {
  setLoadingState: (state: { isLoading?: boolean; error?: unknown }) => void;
  [key: string]: any;
}

export function Loadable(WrapComponent: any) {
  return function (defaultLoadable?: LoadableConfig) {
    return class LoadableComponent extends React.Component<
      MicroComponentProps,
      any
    > {
      state: {
        error: any;
        pastDelay: boolean;
        timedOut: boolean;
        isLoading: boolean;
      } = {
        error: null,
        pastDelay: false,
        timedOut: false,
        isLoading: false,
      };

      mounted: boolean = false;

      delay: NodeJS.Timeout | undefined;

      timeout: NodeJS.Timeout | undefined;

      // eslint-disable-next-line @typescript-eslint/naming-convention
      UNSAFE_componentWillMount() {
        this.mounted = true;
        const {
          loadable = defaultLoadable || {
            delay: 200,
            timeout: 10000,
            loading: null,
          },
        } = this.props;

        const { delay, timeout } = loadable;
        if (typeof delay === 'number') {
          if (delay === 0) {
            this.setState({ pastDelay: true });
          } else {
            this.delay = setTimeout(() => {
              this.setStateWithMountCheck({ pastDelay: true });
            }, delay);
          }
        }

        if (typeof timeout === 'number') {
          this.timeout = setTimeout(() => {
            this.setStateWithMountCheck({ timedOut: true });
          }, timeout);
        }
      }

      componentWillUnmount() {
        this.mounted = false;
        this.setStateWithMountCheck({
          isLoading: false,
          error: null,
        });
        this.clearTimeouts();
      }

      setStateWithMountCheck(newState: Partial<typeof this.state>) {
        if (!this.mounted) {
          return;
        }
        this.setState(newState);
      }

      readonly retry = () => {
        this.setState({ error: null, isLoading: true, timedOut: false });
        // res = loadFn(opts.loader);
        // this._loadModule();
      };

      clearTimeouts() {
        this.delay && clearTimeout(this.delay);
        this.timeout && clearTimeout(this.timeout);
      }

      render() {
        const { isLoading, error, pastDelay, timedOut } = this.state;
        const {
          loadable = defaultLoadable || {
            delay: 200,
            timeout: 10000,
            loading: null,
          },
          ...otherProps
        } = this.props;
        const { loading: LoadingComponent } = loadable;

        logger('Loadable render state', {
          state: this.state,
          props: otherProps,
          loadable,
          defaultLoadable,
        });

        const showLoading = (isLoading || error) && LoadingComponent;
        return (
          <>
            {showLoading && (
              <LoadingComponent
                isLoading={isLoading}
                pastDelay={pastDelay}
                timedOut={timedOut}
                error={error}
                retry={this.retry}
              />
            )}
            <WrapComponent
              style={{ display: showLoading ? 'none' : 'block' }}
              setLoadingState={(props: SetLoadingState) => {
                // loading is not provided and there is a rendering exception
                if (props.error && !LoadingComponent) {
                  throw props.error;
                }
                this.setStateWithMountCheck(props);
              }}
              {...otherProps}
            />
          </>
        );
      }
    };
  };
}
