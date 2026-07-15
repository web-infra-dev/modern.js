import { useFetcher, useLoaderData } from '@modern-js/runtime/router';

const NotesPage = () => {
  const data = useLoaderData() as { items: string[] };
  const fetcher = useFetcher();
  const add = () => fetcher.submit({ text: 'note' }, { method: 'post' });
  return (
    <div>
      <button type="button" onClick={add}>
        add
      </button>
      <ul>
        {data.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default NotesPage;
