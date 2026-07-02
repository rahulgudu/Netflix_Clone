import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    await serverAuth(req);

    const seriesCount = await prismadb.series.count();
    if (seriesCount === 0) {
      return res.status(404).json({ message: "No series found" });
    }

    const randomIndex = Math.floor(Math.random() * seriesCount);

    const randomSeries = await prismadb.series.findMany({
      take: 1,
      skip: randomIndex,
      include: {
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
    });

    return res.status(200).json(randomSeries[0]);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
