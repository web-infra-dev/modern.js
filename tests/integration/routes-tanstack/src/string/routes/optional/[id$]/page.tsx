import { useMatch } from '@modern-js/runtime/tanstack-router';

export default function OptionalPage() {
  const match = useMatch({ from: '/optional/{-$id}' });
  const id = match.loaderData!.id;

  return <div id="optional">string-optional:{id}</div>;
}
