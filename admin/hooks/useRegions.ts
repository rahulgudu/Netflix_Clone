import useSWR from "swr";

import fetcher from "@/lib/fetcher";

const useGetRegions = () => {
    const { data, error, isLoading, mutate } = useSWR(`/api/regions`, fetcher, {
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

export default useGetRegions;
