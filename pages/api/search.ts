import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    await serverAuth(req);

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(200).json([]);
    }

    const queryStr = q.trim();

    // Query Movies
    const movies = await prismadb.movie.findMany({
      where: {
        OR: [
          { title: { contains: queryStr, mode: "insensitive" } },
          { genre: { contains: queryStr, mode: "insensitive" } },
          {
            region: {
              region: { contains: queryStr, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        region: true,
      },
    });

    // Query Series
    const series = await prismadb.series.findMany({
      where: {
        OR: [
          { title: { contains: queryStr, mode: "insensitive" } },
          { genre: { contains: queryStr, mode: "insensitive" } },
          {
            region: {
              region: { contains: queryStr, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        region: true,
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
    });

    // Map types to distinguish client-side rendering card templates
    const formattedMovies = movies.map((movie) => ({
      ...movie,
      type: "movie",
    }));

    const formattedSeries = series.map((s) => ({
      ...s,
      type: "series",
    }));

    // Combine results
    const results = [...formattedMovies, ...formattedSeries];

    return res.status(200).json(results);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
