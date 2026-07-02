import useSWR from "swr";
import fetcher from "@/lib/fetcher";

const useFavourites = ({ profileId }: { profileId?: string | null } = {}) => {
  const url = profileId
    ? `/api/favourites?profileId=${profileId}`
    : `/api/favourites`;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  };
};

export default useFavourites;
