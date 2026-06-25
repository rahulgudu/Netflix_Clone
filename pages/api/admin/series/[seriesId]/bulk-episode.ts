import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";
import signHlsUrl from "@/lib/generateHSL";

// POST /api/admin/series/[seriesId]/bulk-episode
// Body: { seasonId: string, episodes: { title: string, videoId: string, duration: string }[] }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { currentUser } = await serverAuth(req);
  if (currentUser.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { seriesId } = req.query;
  if (typeof seriesId !== "string") {
    return res.status(400).json({ message: "Invalid series ID" });
  }

  if (req.method !== "POST") return res.status(405).end();

  try {
    const { seasonId, episodes } = req.body as {
      seasonId: string;
      episodes: { title: string; videoId: string; duration: string }[];
    };

    if (!seasonId || !Array.isArray(episodes) || episodes.length === 0) {
      return res.status(400).json({ message: "seasonId and episodes[] required" });
    }

    // Validate all rows before doing anything
    for (const ep of episodes) {
      if (!ep.title || !ep.videoId || !ep.duration) {
        return res.status(400).json({ message: "Each episode must have title, videoId, and duration" });
      }
    }

    // Get current episode count so we can number the new ones correctly
    const existing = await prismadb.episode.findMany({ where: { seasonId } });
    let nextNumber = existing.length + 1;

    const created = [];
    for (const ep of episodes) {
      const videoUrl = await signHlsUrl(ep.videoId);
      const episode = await prismadb.episode.create({
        data: {
          number: nextNumber,
          title: ep.title,
          videoUrl,
          duration: ep.duration,
          seasonId,
        },
      });
      created.push(episode);
      nextNumber++;
    }

    // Update series lastModifiedNote
    const season = await prismadb.season.findUnique({ where: { id: seasonId } });
    await prismadb.series.update({
      where: { id: seriesId },
      data: {
        lastModifiedNote: `${created.length} episode(s) added to Season ${season?.number}`,
      },
    });

    return res.status(201).json({ created });
  } catch (error) {
    console.error("Error bulk-adding episodes:", error);
    return res.status(500).end();
  }
}
