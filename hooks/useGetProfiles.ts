import useSWR from "swr";

import fetcher from "@/lib/fetcher";

const useGetProfiles = () => {
  const { data, error, isLoading, mutate } = useSWR(`/api/profiles/`, fetcher, {
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

export default useGetProfiles;
