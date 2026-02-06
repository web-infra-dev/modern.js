function getCountStore() {
  const key = '__MODERN_TANSTACK_MF_COUNT__';
  const globalObject = globalThis as Record<string, unknown>;

  if (typeof globalObject[key] !== 'number') {
    globalObject[key] = 0;
  }

  return {
    get() {
      return globalObject[key] as number;
    },
    set(value: number) {
      globalObject[key] = value;
    },
  };
}

export const loader = () => {
  const countStore = getCountStore();
  return {
    msg: 'host-mf-loader',
    count: countStore.get(),
  };
};

export const action = async ({ request }: { request: Request }) => {
  const countStore = getCountStore();
  const formData = await request.formData();
  const amountRaw = formData.get('amount');
  const amount =
    typeof amountRaw === 'string' ? Number.parseInt(amountRaw, 10) : NaN;
  const nextCount = countStore.get() + (Number.isFinite(amount) ? amount : 1);
  countStore.set(nextCount);

  return Response.json({
    count: nextCount,
  });
};
