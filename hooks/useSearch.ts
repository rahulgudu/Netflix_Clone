import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useSearch = (query: string) => {
  const url = query ? `/api/search?q=${encodeURIComponent(query)}` : null;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  };
};

export default useSearch;
