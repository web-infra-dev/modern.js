import { useEffect, useState } from 'react';

export function useLoader<T>(loader: () => Promise<T>): {
  data: T | null;
  loading: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await loader();
        setData(result);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading };
}
