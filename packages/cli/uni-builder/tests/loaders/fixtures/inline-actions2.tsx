let count = 0;

const increment = () => {
  'use server';
  count += 1;
};

export { increment as inc };

export default function SimpleCounter() {
  async function decrement() {
    'use server';
    count -= 1;
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <form action={decrement}>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -
        </button>
      </form>

      <span className="text-2xl">{count}</span>

      <form action={increment}>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          +
        </button>
      </form>
    </div>
  );
}
