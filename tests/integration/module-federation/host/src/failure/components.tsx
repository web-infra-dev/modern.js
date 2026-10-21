import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import {
  getInstance,
  loadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime';
import { reportRecovery } from './events';

type LazyOptions = Parameters<
  NonNullable<ReturnType<typeof getInstance>>['createLazyComponent']
>[0];
type Options = Omit<LazyOptions, 'fallback'> &
  Partial<Pick<LazyOptions, 'fallback'>> & { componentOnly?: boolean };
export function RecoveryCard({
  status,
  remote,
  handler,
  detail,
}: {
  status: string;
  remote: string;
  handler: string;
  detail?: string;
}) {
  useEffect(
    () => reportRecovery(status, remote, handler),
    [status, remote, handler],
  );
  return (
    <section
      className="weather-card recovery-card"
      role="alert"
      data-testid="recovery-card"
      data-handler={handler}
      data-error={detail}
    >
      <span aria-hidden="true">☁</span>
      <h2>Weather station unavailable</h2>
      <p>{status}</p>
      <small>Turn off the simulated failure to reconnect.</small>
    </section>
  );
}
class RemoteBoundary extends Component<
  { children: ReactNode; remote: string },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <RecoveryCard
        status={
          this.state.error.message.includes('LAB_WEATHER_API')
            ? 'Data fallback'
            : 'Component fallback'
        }
        remote={this.props.remote}
        handler="React error boundary"
      />
    ) : (
      this.props.children
    );
  }
}
// Each mounted instance owns its params and loader cache. SSR requests never
// mutate a process-wide failure flag or a previously loaded production remote.
export function labComponent<P extends object = Record<string, unknown>>(
  options: Options,
  id: string,
  scope = id,
  nested = false,
) {
  function LabRemote({
    remoteProps: props,
    query,
  }: {
    remoteProps: P;
    query: URLSearchParams;
  }) {
    const requested = query.get('failure') || '';
    const target = query.get('target');
    const deferred =
      query.get('after') === 'remount' &&
      !(props as Record<string, unknown>).labRemounted;
    const selected =
      !deferred && (!target || scope.includes(target)) ? requested : '';
    const failure =
      nested && selected === 'inner-network' ? 'network' : selected;
    const run = query.get('run') || '0';
    const Lazy = useMemo(() => {
      const loader =
        failure === 'network'
          ? async () => {
              const name = `offline_${id.replace(/\W/g, '_')}_${run.replace(/\W/g, '_')}`;
              registerRemotes([
                {
                  name,
                  shareScope: 'lab-fault',
                  entry: `${process.env.MF_LAB_ORIGIN}/_lab/offline/${name}/mf-manifest.json`,
                },
              ]);
              const module = await loadRemote(`${name}/Weather`);
              if (!module) throw new Error('LAB_REMOTE_OFFLINE');
              return module;
            }
          : options.loader;
      if (options.componentOnly)
        return lazy(
          async () =>
            (await loader()) as {
              default: ComponentType<P & { labFailure?: string }>;
            },
        );
      return getInstance()!.createLazyComponent({
        ...options,
        loader,
        dataFetchParams: {
          isDowngrade: false,
          ...options.dataFetchParams,
          labFailure: failure,
        },
        fallback: (error: unknown) => (
          <RecoveryCard
            detail={JSON.stringify(error, (_key, value) =>
              value instanceof Error ? { message: value.message } : value,
            )}
            status={
              failure === 'data' || failure === 'invalid'
                ? 'Data fallback'
                : 'Remote fallback'
            }
            remote={id}
            handler="MF adapter fallback"
          />
        ),
      }) as ComponentType<P & { labFailure?: string }>;
    }, [failure, run]);
    return (
      <div className="lab-remote-slot" data-lab-remote={id}>
        <RemoteBoundary key={`${failure}:${run}`} remote={id}>
          <Suspense fallback={options.loading}>
            <Lazy {...props} labFailure={failure} labRun={run} />
          </Suspense>
        </RemoteBoundary>
      </div>
    );
  }
  if (nested) {
    return function NestedRemote(props: P) {
      const forwarded = props as Record<string, unknown>;
      const query = new URLSearchParams({
        failure: String(forwarded.labFailure || ''),
        run: String(forwarded.labRun || '0'),
        target: scope,
      });
      return <LabRemote remoteProps={props} query={query} />;
    };
  }
  return function RoutedRemote(props: P) {
    const [query] = useSearchParams();
    return <LabRemote remoteProps={props} query={query} />;
  };
}
