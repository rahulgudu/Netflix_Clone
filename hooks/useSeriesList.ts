import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useSeriesList = () => {
  const { data, error, isLoading } = useSWR("/api/series", fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data, error, isLoading };
};

export default useSeriesList;
