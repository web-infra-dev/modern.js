export type RequestOption<TQuery = never, TData = never> = ClearRecord<{
  query: TQuery;
  data: TData;
}> & { dataType?: string };

export type ClearRecord<O extends Record<string, any>> = {
  [K in keyof O as O[K] extends never ? never : K]: O[K];
};
