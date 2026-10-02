import { useMatch } from '@modern-js/plugin-tanstack/runtime';

export default function OptionalPage() {
  const match = useMatch({ from: '/optional/{-$id}' });
  const id = match.loaderData!.id;

  return <div id="optional">stream-optional:{id}</div>;
}
