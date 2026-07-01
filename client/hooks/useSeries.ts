import useSWR from "swr";
import fetcher from "@/lib/fetcher";

const useSeries = (seriesId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    seriesId ? `/api/series/${seriesId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return { data, error, isLoading, mutate };
};

export default useSeries;
