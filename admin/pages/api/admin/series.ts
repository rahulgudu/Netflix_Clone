import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import signHlsUrl from "@/lib/generateHSL";
import { getUser } from "@/lib/getUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { email } = req.query;
    const { user: currentUser } = await getUser(email as string);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(401).end();
    }

    const { title, description, trailerId, thumbnailUrl, genre, releaseYear, cast, rating, regionId, seasons } =
      req.body;

    if (!title || !description || !trailerId || !genre || !regionId || !seasons) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const trailerUrl = trailerId ? await signHlsUrl(trailerId) : null;

    const series = await prismadb.series.create({
      data: {
        title,
        description,
        trailerUrl,
        thumbnailUrl,
        genre,
        cast: cast ?? [],
        rating,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        regionId,
        seasons: {
          create: await Promise.all(seasons.map(async (season: any) => ({
            number: Number(season.number),
            title: season.title,
            thumbnailUrl: season.thumbnailUrl,
            episodes: {
              create: await Promise.all(season.episodes.map(async (episode: any) => ({
                number: Number(episode.number),
                title: episode.title,
                videoUrl: episode.videoId ? await signHlsUrl(episode.videoId) : "",
                duration: episode.duration,
              }))),
            },
          }))),
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
