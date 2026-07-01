import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useSeriesList = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/series", fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data, error, isLoading, mutate };
};

export default useSeriesList;
