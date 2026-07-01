import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";
import signHlsUrl from "@/lib/generateHSL";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { currentUser } = await serverAuth(req);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { movieId } = req.query;
    if (typeof movieId !== "string" || !movieId) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    // DELETE movie
    if (req.method === "DELETE") {
      await prismadb.movie.delete({
        where: { id: movieId },
      });
      return res.status(200).json({ message: "Movie deleted successfully" });
    }

    // PUT update movie info
    if (req.method === "PUT") {
      const {
        title,
        description,
        videoId,
        thumbnailUrl,
        trailerId,
        genre,
        duration,
        regionId,
      } = req.body;

      const videoUrl = videoId ? await signHlsUrl(videoId) : undefined;
      const trailerUrl = trailerId ? await signHlsUrl(trailerId) : undefined;

      const updatedMovie = await prismadb.movie.update({
        where: { id: movieId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(videoUrl && { videoUrl }),
          ...(thumbnailUrl && { thumbnailUrl }),
          ...(trailerUrl && { trailerUrl }),
          ...(genre && { genre }),
          ...(duration && { duration }),
          ...(regionId && { regionId }),
        },
      });

      return res.status(200).json(updatedMovie);
    }

    return res.status(405).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
