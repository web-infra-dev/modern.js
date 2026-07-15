import { useLoaderData } from '@modern-js/runtime/router';

const NotesPage = () => {
  const data = useLoaderData() as { items: string[] };
  const add = () => {
    fetch('/notes', { method: 'POST', body: JSON.stringify({ text: 'note' }) });
  };
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
