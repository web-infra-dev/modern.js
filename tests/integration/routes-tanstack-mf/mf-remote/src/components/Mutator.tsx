import { useFetcher } from '@modern-js/runtime/tanstack-router';

export default function Mutator() {
  const fetcher = useFetcher();
  const FetcherForm = fetcher.Form;
  const data = fetcher.data as { count?: number } | undefined;

  return (
    <div id="remote-mutator">
      <FetcherForm method="post" action="/mf">
        <input name="amount" defaultValue="2" />
        <button type="submit" data-testid="remote-fetcher-submit">
          remote-submit
        </button>
      </FetcherForm>
      <button
        type="button"
        data-testid="remote-fetcher-load"
        onClick={() => {
          void fetcher.submit(
            {},
            {
              method: 'get',
              action: '/mf',
            },
          );
        }}
      >
        remote-load
      </button>
      <div id="remote-fetcher-state">{fetcher.state}</div>
      <div id="remote-fetcher-data">
        remote-fetcher:
        {typeof data?.count === 'number' ? data.count : 'none'}
      </div>
    </div>
  );
}
