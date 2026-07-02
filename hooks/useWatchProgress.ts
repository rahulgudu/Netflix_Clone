import useSWR from "swr";
import fetcher from "@/lib/fetcher";

const useWatchProgress = (profileId?: string | null) => {
  const url = profileId
    ? `/api/watch-progress?profileId=${profileId}`
    : `/api/watch-progress`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
    revalidateIfStale: true,
  });

  return {
    data: (data as any[]) || [],
    error,
    isLoading,
    mutate,
  };
};

export default useWatchProgress;
