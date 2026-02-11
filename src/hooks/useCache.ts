import { useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // 1. Check local storage
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const parsed: CacheEntry<T> = JSON.parse(cached);
          const now = Date.now();
          
          // If data is valid (even if stale), show it immediately
          if (parsed.data) {
            setData(parsed.data);
            setLoading(false); // Immediate display
          }

          // If stale, refetch in background
          if (now - parsed.timestamp > ttl) {
            console.log(`[Cache] Stale data for ${key}, refetching...`);
            fetchFresh();
          } else {
            console.log(`[Cache] Using fresh cache for ${key}`);
          }
        } catch (e) {
          console.warn(`[Cache] Failed to parse cache for ${key}`, e);
          fetchFresh();
        }
      } else {
        // No cache, fetch immediately
        console.log(`[Cache] No cache for ${key}, fetching...`);
        fetchFresh();
      }
    };

    const fetchFresh = async () => {
      try {
        const newData = await fetcher();
        if (isMounted) {
          setData(newData);
          setLoading(false);
          // Update cache
          localStorage.setItem(key, JSON.stringify({
            data: newData,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        if (isMounted) {
          console.error(`[Cache] Fetch error for ${key}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, ttl]); // Removed fetcher from deps to avoid infinite loops if it's not stable

  return { data, loading, error };
}
