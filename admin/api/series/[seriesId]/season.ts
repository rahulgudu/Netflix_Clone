import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { currentUser } = await serverAuth(req);
  if (currentUser.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { seriesId } = req.query;
  if (typeof seriesId !== "string") {
    return res.status(400).json({ message: "Invalid series ID" });
  }

  // POST — add a new season
  if (req.method === "POST") {
    try {
      const existingSeasons = await prismadb.season.findMany({ where: { seriesId } });
      const nextNumber = existingSeasons.length + 1;

      const season = await prismadb.season.create({
        data: {
          number: nextNumber,
          seriesId,
        },
        include: { episodes: true },
      });

      await prismadb.series.update({
        where: { id: seriesId },
        data: { lastModifiedNote: `Season ${nextNumber} added` },
      });

      return res.status(201).json(season);
    } catch (error) {
      console.error("Error adding season:", error);
      return res.status(500).end();
    }
  }

  // DELETE — remove a season by seasonId in body
  if (req.method === "DELETE") {
    try {
      const { seasonId } = req.body;
      if (!seasonId) return res.status(400).json({ message: "seasonId required" });

      await prismadb.episode.deleteMany({ where: { seasonId } });
      const deleted = await prismadb.season.delete({ where: { id: seasonId } });

      await prismadb.series.update({
        where: { id: seriesId },
        data: { lastModifiedNote: `Season ${deleted.number} removed` },
      });

      return res.status(200).json({ message: "Season deleted" });
    } catch (error) {
      console.error("Error deleting season:", error);
      return res.status(500).end();
    }
  }

  return res.status(405).end();
}
