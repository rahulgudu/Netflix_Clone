import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { currentUser } = await serverAuth(req);

    // ─────────────────────────────────────────────────────────────
    // GET  /api/watch-progress?profileId=xxx
    // Returns all in-progress items (percentage < 95) sorted by most recent
    // ─────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { profileId, all } = req.query;
      const getAll = all === "true";

      const where = profileId
        ? {
            profileId: profileId as string,
            ...(getAll ? {} : { percentage: { lt: 99.5 } }),
          }
        : {
            userId: currentUser.id,
            ...(getAll ? {} : { percentage: { lt: 99.5 } }),
          };

      const progress = await prismadb.watchProgress.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      return res.status(200).json(progress);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/watch-progress
    // Upsert a watch progress record
    // Body: { profileId?, contentType, movieId?, episodeId?, seriesId?, seasonId?,
    //         title, thumbnailUrl, episodeLabel?, currentTime, duration }
    // ─────────────────────────────────────────────────────────────
    if (req.method === "POST") {
      const {
        profileId,
        contentType,
        movieId,
        episodeId,
        seriesId,
        seasonId,
        title,
        thumbnailUrl,
        episodeLabel,
        currentTime,
        duration,
      } = req.body;

      if (!contentType || (!movieId && !episodeId)) {
        return res.status(400).json({ error: "contentType and movieId or episodeId are required" });
      }

      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

      // ── Explicit reset: currentTime=0 means "mark as unwatched / reset progress"
      if (currentTime === 0 && episodeId) {
        await prismadb.watchProgress.deleteMany({
          where: profileId
            ? { profileId, episodeId }
            : { userId: currentUser.id, episodeId },
        });
        return res.status(200).json({ reset: true });
      }



      // Upsert based on profileId or userId + content identifier
      const baseData = {
        contentType,
        movieId: movieId || null,
        episodeId: episodeId || null,
        seriesId: seriesId || null,
        seasonId: seasonId || null,
        title: title || null,
        thumbnailUrl: thumbnailUrl || null,
        episodeLabel: episodeLabel || null,
        currentTime,
        duration,
        percentage,
      };

      if (profileId) {
        if (movieId) {
          await prismadb.watchProgress.upsert({
            where: { profileId_movieId: { profileId, movieId } },
            update: { ...baseData },
            create: { profileId, userId: null, ...baseData },
          });
        } else if (episodeId) {
          // No compound unique for profileId+episodeId in schema — use updateMany/create pattern
          const existing = await prismadb.watchProgress.findFirst({
            where: { profileId, episodeId },
          });
          if (existing) {
            await prismadb.watchProgress.update({
              where: { id: existing.id },
              data: baseData,
            });
          } else {
            await prismadb.watchProgress.create({
              data: { profileId, userId: null, ...baseData },
            });
          }
        }
      } else {
        const uid = currentUser.id;
        if (movieId) {
          await prismadb.watchProgress.upsert({
            where: { userId_movieId: { userId: uid, movieId } },
            update: { ...baseData },
            create: { userId: uid, profileId: null, ...baseData },
          });
        } else if (episodeId) {
          const existing = await prismadb.watchProgress.findFirst({
            where: { userId: uid, episodeId },
          });
          if (existing) {
            await prismadb.watchProgress.update({
              where: { id: existing.id },
              data: baseData,
            });
          } else {
            await prismadb.watchProgress.create({
              data: { userId: uid, profileId: null, ...baseData },
            });
          }
        }
      }

      return res.status(200).json({ saved: true, percentage });
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/watch-progress?id=xxx  — manual remove from list
    // ─────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id required" });
      await prismadb.watchProgress.delete({ where: { id: id as string } });
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
