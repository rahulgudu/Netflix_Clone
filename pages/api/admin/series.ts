import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { title, description, trailerId, thumbnailUrl, genre, releaseYear, cast, rating, regionId, seasons } =
      req.body;

    if (!title || !description || !trailerId || !genre || !regionId || !seasons) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const series = await prismadb.series.create({
      data: {
        title,
        description,
        trailerId,
        thumbnailUrl,
        genre,
        cast: cast ?? [],
        rating,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        regionId,
        seasons: {
          create: seasons.map((season: any) => ({
            number: Number(season.number),
            title: season.title,
            thumbnailUrl: season.thumbnailUrl,
            episodes: {
              create: season.episodes.map((episode: any) => ({
                number: Number(episode.number),
                title: episode.title,
                videoId: episode.videoId,
                duration: episode.duration,
              })),
            },
          })),
        },
      },
      include: {
        seasons: {
          include: { episodes: true },
        },
      },
    });

    return res.status(201).json(series);
  } catch (error) {
    console.error("Error creating series:", error);
    return res.status(500).end();
  }
}
