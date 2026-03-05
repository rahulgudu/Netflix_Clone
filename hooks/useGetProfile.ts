import fetcher from "@/lib/fetcher";
import useSWR from "swr";

const useCurrentProfile = ({ profileId }: { profileId?: string }) => {
    const { data, error, isLoading, mutate } = useSWR(
        profileId ? `/api/profiles/profile?profileId=${profileId}` : null,
        fetcher
    );

    return {
        data,
        error,
        isLoading,
        mutate,
    };
};

export default useCurrentProfile;
