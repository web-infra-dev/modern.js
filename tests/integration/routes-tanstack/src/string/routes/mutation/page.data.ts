const COUNTER_KEY = '__tanstackMutationCounter';

function getCount() {
  const value = (globalThis as any)[COUNTER_KEY];
  return typeof value === 'number' ? value : 0;
}

export const loader = () => {
  return {
    count: getCount(),
  };
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const amount = Number(formData.get('amount') || 1);
  const nextCount = getCount() + amount;
  (globalThis as any)[COUNTER_KEY] = nextCount;

  return new Response(
    JSON.stringify({
      count: nextCount,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};
