import useCurrentUser from "@/hooks/useCurrentUser";
import useFavourites from "@/hooks/useFavourites";
import useCurrentProfile from "@/hooks/useGetProfile";
import axios from "axios";
import React, { useCallback, useMemo } from "react";
import { AiOutlineCheck, AiOutlinePlus } from "react-icons/ai";

interface FavouriteBtnProps {
  movieId?: string;
  profileId?: string;
}

const FavouriteBtn: React.FC<FavouriteBtnProps> = ({ movieId, profileId }) => {

  const { mutate: mutateFavourite } = useFavourites({ profileId });

  const { data: currentUser, mutate: mutateUser } = useCurrentUser();

  const { data: currentProfile, mutate: mutateProfile } =
    useCurrentProfile(profileId ? { profileId } : {profileId: undefined});

  const isProfileMode = !!profileId;

  const isFavourite = useMemo(() => {
    const list = isProfileMode
      ? currentProfile?.favouriteIds || []
      : currentUser?.favouriteIds || [];

    return movieId ? list.includes(movieId) : false;
  }, [isProfileMode, currentProfile, currentUser, movieId]);

  const toggleFavourite = useCallback(async () => {
    if (!movieId) return;

    let response;

    const url = isProfileMode
      ? `/api/favourite?email=${currentUser?.email}&isProfile=true&profileId=${profileId}`
      : `/api/favourite?email=${currentUser?.email}`;

    if (isFavourite) {
      response = await axios.delete(url, { data: { movieId } });
      window.location.reload();
    } else {
      response = await axios.post(url, { movieId });
    }

    const updatedFavouriteIds = response?.data?.favouriteIds;

    if (isProfileMode) {
      mutateProfile(
        {
          ...currentProfile,
          favouriteIds: updatedFavouriteIds,
        },
        false
      );
    } else {
      mutateUser(
        {
          ...currentUser,
          favouriteIds: updatedFavouriteIds,
        },
        false
      );
    }

    // refresh favourites row
    mutateFavourite();

  }, [
    movieId,
    isFavourite,
    isProfileMode,
    currentUser,
    currentProfile,
    profileId,
    mutateUser,
    mutateProfile,
    mutateFavourite
  ]);

  const Icon = isFavourite ? AiOutlineCheck : AiOutlinePlus;

  return (
    <div
      onClick={toggleFavourite}
      className="cursor-pointer group/item w-6 h-6 lg:w-10 lg:h-10 border-2 border-white rounded-full flex justify-center items-center transition hover:border-neutral-300"
    >
      <Icon
        className="text-white group-hover/item:text-neutral-300"
        size={30}
      />
    </div>
  );
};

export default FavouriteBtn;