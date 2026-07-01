import { NextApiRequest, NextApiResponse } from "next";
import { without } from "lodash";
import prismadb from "@/lib/prismadb";
import { getUser } from "@/lib/getUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, isProfile, profileId } = req.query;
    const { movieId } = req.body;

    if (!email || !movieId) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const { user: currentUser } = await getUser(email as string);

    const movie = await prismadb.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const isProfileMode = isProfile === "true";

    if (isProfileMode && profileId) {
      const profile = await prismadb.profiles.findUnique({
        where: { id: profileId as string },
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      let favouriteIds = profile.favouriteIds || [];

      if (req.method === "POST") {
        if (!favouriteIds.includes(movieId)) {
          favouriteIds = [...favouriteIds, movieId];
        }
      }

      if (req.method === "DELETE") {
        favouriteIds = without(favouriteIds, movieId);
      }

      const updatedProfile = await prismadb.profiles.update({
        where: { id: profileId as string },
        data: { favouriteIds },
      });

      return res.status(200).json({
        favouriteIds: updatedProfile.favouriteIds,
      });
    }

    let favouriteIds = currentUser.favouriteIds || [];

    if (req.method === "POST") {
      if (!favouriteIds.includes(movieId)) {
        favouriteIds = [...favouriteIds, movieId];
      }
    }

    if (req.method === "DELETE") {
      favouriteIds = without(favouriteIds, movieId);
    }

    const updatedUser = await prismadb.user.update({
      where: { email: currentUser.email || "" },
      data: { favouriteIds },
    });

    return res.status(200).json({
      favouriteIds: updatedUser.favouriteIds,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}