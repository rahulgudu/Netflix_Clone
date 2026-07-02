import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useSeriesBillboard = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/random-series", fetcher, {
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

export default useSeriesBillboard;
