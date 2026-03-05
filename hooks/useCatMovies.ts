import useSWR from "swr";

import fetcher from "@/lib/fetcher";

const useCatMovies = (category: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    category ? `/api/categories/${category}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
};

export default useCatMovies;
