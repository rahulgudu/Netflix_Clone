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
  if (typeof seriesId !== "string" || !seriesId) {
    return res.status(400).json({ message: "Invalid series ID" });
  }

  // DELETE — remove series and all its seasons/episodes (cascade)
  if (req.method === "DELETE") {
    try {
      const series = await prismadb.series.findUnique({
        where: { id: seriesId },
        include: { seasons: true },
      });
      if (!series) return res.status(404).json({ message: "Series not found" });

      // Delete episodes for each season, then seasons, then series
      for (const season of series.seasons) {
        await prismadb.episode.deleteMany({ where: { seasonId: season.id } });
      }
      await prismadb.season.deleteMany({ where: { seriesId } });
      await prismadb.series.delete({ where: { id: seriesId } });

      return res.status(200).json({ message: "Series deleted" });
    } catch (error) {
      console.error("Error deleting series:", error);
      return res.status(500).end();
    }
  }

  // PUT — update series info
  if (req.method === "PUT") {
    try {
      const { title, description, genre, trailerId, thumbnailUrl, regionId, lastModifiedNote } = req.body;

      const trailerUrl = trailerId ? await signHlsUrl(trailerId) : undefined;

      const series = await prismadb.series.update({
        where: { id: seriesId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(genre && { genre }),
          ...(trailerUrl && { trailerUrl }),
          ...(thumbnailUrl && { thumbnailUrl }),
          ...(regionId && { regionId }),
          ...(lastModifiedNote !== undefined && { lastModifiedNote }),
        },
        include: {
          seasons: { include: { episodes: true }, orderBy: { number: "asc" } },
        },
      });

      return res.status(200).json(series);
    } catch (error) {
      console.error("Error updating series:", error);
      return res.status(500).end();
    }
  }

  return res.status(405).end();
}
