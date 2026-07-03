import useSWR from 'swr';
import { Button } from '../LazyComponent';

type SWRProbeProps = {
  owner: 'garfish' | 'remote';
};

export default function SWRProbe({ owner }: SWRProbeProps) {
  const { data = 'pending' } = useSWR(
    `async-chunk-runtime-${owner}`,
    async () => `${owner}:ready`,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return (
    <div data-testid={`${owner}-swr-probe`}>
      <p>{data}</p>
      <span>{Button}</span>
    </div>
  );
}
