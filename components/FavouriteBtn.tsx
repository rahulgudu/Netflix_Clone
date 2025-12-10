import useCurrentUser from "@/hooks/useCurrentUser";
import useFavourites from "@/hooks/useFavourites";
import axios from "axios";
import React, { useCallback, useMemo } from "react";
import { AiOutlineCheck, AiOutlinePlus } from "react-icons/ai";
interface FavouriteBtnProps {
  movieId?: string;
}
const FavouriteBtn: React.FC<FavouriteBtnProps> = ({ movieId }) => {
  const { mutate: mutateFavourite } = useFavourites();
  const { data: currentUser, mutate } = useCurrentUser();

  const isFavourite = useMemo(() => {
    const list = currentUser?.favouriteIds || [];
    return list.includes(movieId);
  }, [currentUser, movieId]);

  const toggleFavourite = useCallback(async () => {
    let response;
    if (isFavourite) {
      response = await axios.delete(
        `/api/favourite?email=${currentUser?.email}`,
        { data: { movieId } }
      );
    } else {
      response = await axios.post(
        `/api/favourite?email=${currentUser?.email}`,
        { movieId }
      );
    }

    const updatedFavouriteIds = response?.data?.favouriteIds;
    mutate({
      ...currentUser,
      favouriteIds: updatedFavouriteIds,
    });
    mutateFavourite();
  }, [movieId, isFavourite, currentUser, mutate, mutateFavourite]);

  const Icon = isFavourite ? AiOutlineCheck : AiOutlinePlus;
  return (
    <div
      onClick={toggleFavourite}
      className="cursor-pointer group/item w-6 h-6 lg:w-10 lg:h-10 border-2 border-white rounded-full flex justify-center items-center transition hover:border-neutral-300">
      <Icon
        className="text-white group-hover/item:text-neutral-300"
        size={30}
      />
    </div>
  );
};

export default FavouriteBtn;
