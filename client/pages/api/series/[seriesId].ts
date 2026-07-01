import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    await serverAuth(req);

    const { seriesId } = req.query;

    if (typeof seriesId !== "string" || !seriesId) {
      throw new Error("Invalid ID");
    }

    const series = await prismadb.series.findUnique({
      where: { id: seriesId },
      include: {
        seasons: {
          orderBy: { number: "asc" },
          include: {
            episodes: { orderBy: { number: "asc" } },
          },
        },
      },
    });

    if (!series) {
      throw new Error("Series not found");
    }

    return res.status(200).json(series);
  } catch (error) {
    console.log(error);
    return res.status(500).end();
  }
}
