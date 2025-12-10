import useSWR from "swr";

import fetcher from "@/lib/fetcher";

const useFavourites = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/favourites",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  return {
    data,
    error,
    isLoading,
    mutate,
  };
};

export default useFavourites;
