import Counter from '../client/Counter';

function getData() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(101);
    }, 1000);
  });
}

export default async function Show() {
  const count = await getData();

  return (
    <div>
      Show: <Counter count={count} />
    </div>
  );
}
