import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useRegions = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/regions", fetcher, {
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

export default useRegions;
