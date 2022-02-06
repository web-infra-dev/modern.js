// logical reference to https://github.com/jamiebuilds/react-loadable/blob/6201c5837b212d6244c57f3748f2b1375096beeb/src/index.js
import React from 'react';
import { logger } from '../util';

export type LoadingComponent = React.ComponentType<{
  isLoading: boolean;
  pastDelay: boolean;
  timedOut: boolean;
  error: any;
  retry: () => void;
}>;

interface LoadingConfig {
  timeout?: number;
  delay?: number;
  LoadingComponent?: LoadingComponent;
}

interface SetLoadingState {
  isLoading?: boolean;
  error?: unknown;
}

export interface MicroProps {
  setLoadingState: (state: { isLoading?: boolean; error?: unknown }) => void;
  [key: string]: any;
}

export function Loadable(WrapComponent: any) {
  return function (defaultLoadingComponent?: LoadingComponent) {
    return class LoadableComponent extends React.Component<
      { loadingConfig: LoadingConfig },
      any
    > {
      state: {
        error: any;
        pastDelay: boolean;
        timedOut: boolean;
        isLoading: boolean;
        delay: number;
        timeout: number;
        LoadingComponent?: LoadingComponent;
      };

      private mounted: boolean = false;

      private delay: NodeJS.Timeout | undefined;

      private timeout: NodeJS.Timeout | undefined;

      constructor(props: { loadingConfig: LoadingConfig }) {
        super(props);

        const {
          LoadingComponent = defaultLoadingComponent,
          timeout = 10000,
          delay = 200,
        } = props.loadingConfig || {};

        // eslint-disable-next-line react/state-in-constructor
        this.state = {
          LoadingComponent,
          timeout,
          delay,
          error: null,
          pastDelay: false,
          timedOut: false,
          isLoading: false,
        };
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      UNSAFE_componentWillMount() {
        const { delay, timeout } = this.state;
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

      componentDidMount() {
        this.mounted = true;
      }

      componentWillUnmount() {
        this.mounted = false;
        this.setStateWithMountCheck({
          isLoading: false,
          error: null,
        });
        this.clearTimeouts();
      }

      private setStateWithMountCheck(newState: Partial<typeof this.state>) {
        if (!this.mounted) {
          return;
        }

        this.setState(newState);
      }

      private readonly retry = () => {
        this.setState({ error: null, isLoading: true, timedOut: false });
        // res = loadFn(opts.loader);
        // this._loadModule();
      };

      private clearTimeouts() {
        this.delay && clearTimeout(this.delay);
        this.timeout && clearTimeout(this.timeout);
      }

      render() {
        const { isLoading, error, pastDelay, timedOut, LoadingComponent } =
          this.state;
        const showLoading = (isLoading || error) && LoadingComponent;
        logger('Loadable state', this.state);

        return (
          <>
            {showLoading && LoadingComponent && (
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
              setLoadingState={(props: SetLoadingState) =>
                this.setStateWithMountCheck(props)
              }
              {...this.props}
            />
          </>
        );
      }
    };
  };
}
