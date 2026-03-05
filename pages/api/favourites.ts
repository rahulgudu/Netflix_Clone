import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "GET") {
      res.status(405).end();
      return;
    }

    const currentUser = await serverAuth(req);
    // const currentUser = await serverAuth(req, res);
    const { profileId } = req.query;

    let favouriteMovies = [];

    if (profileId && profileId !== "") {
      const profile = await prismadb.profiles.findUnique({
        where: {
          id: profileId as string,
        },
      });

      favouriteMovies = await prismadb.movie.findMany({
        where: {
          id: {
            in: profile?.favouriteIds || [],
          },
        },
      });

      res.status(200).json(favouriteMovies);
      return;
    }

    favouriteMovies = await prismadb.movie.findMany({
      where: {
        id: {
          in: currentUser?.favouriteIds || [],
        },
      },
    });

    res.status(200).json(favouriteMovies);
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}