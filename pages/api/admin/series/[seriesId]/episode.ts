import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";
import signHlsUrl from "@/lib/generateHSL";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { currentUser } = await serverAuth(req);
  if (currentUser.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { seriesId } = req.query;
  if (typeof seriesId !== "string") {
    return res.status(400).json({ message: "Invalid series ID" });
  }

  // POST — add a new episode to a season
  if (req.method === "POST") {
    try {
      const { seasonId, title, videoId, duration } = req.body;
      if (!seasonId || !title || !videoId || !duration) {
        return res.status(400).json({ message: "seasonId, title, videoId, duration required" });
      }

      const existingEpisodes = await prismadb.episode.findMany({ where: { seasonId } });
      const nextNumber = existingEpisodes.length + 1;

      const videoUrl = await signHlsUrl(videoId);

      const episode = await prismadb.episode.create({
        data: {
          number: nextNumber,
          title,
          videoId,
          videoUrl,
          duration,
          seasonId,
        },
      });

      const season = await prismadb.season.findUnique({ where: { id: seasonId } });
      await prismadb.series.update({
        where: { id: seriesId },
        data: { lastModifiedNote: `New episode added to Season ${season?.number}` },
      });

      return res.status(201).json(episode);
    } catch (error) {
      console.error("Error adding episode:", error);
      return res.status(500).end();
    }
  }

  // DELETE — remove an episode
  if (req.method === "DELETE") {
    try {
      const { episodeId } = req.body;
      if (!episodeId) return res.status(400).json({ message: "episodeId required" });

      await prismadb.episode.delete({ where: { id: episodeId } });

      return res.status(200).json({ message: "Episode deleted" });
    } catch (error) {
      console.error("Error deleting episode:", error);
      return res.status(500).end();
    }
  }

  return res.status(405).end();
}
