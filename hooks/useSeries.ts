import useSWR from "swr";
import fetcher from "@/lib/fetcher";

const useSeries = (seriesId: string) => {
  const { data, error, isLoading } = useSWR(
    seriesId ? `/api/series/${seriesId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return { data, error, isLoading };
};

export default useSeries;
