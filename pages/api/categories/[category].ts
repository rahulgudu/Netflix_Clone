import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { category } = req.query;

    if (req.method !== "GET") {
      return res.status(405).end();
    }

    if (typeof category !== "string") {
      throw new Error("Invalid category");
    }

    const movies = await prismadb.movie.findMany({
      where: {
        genre: {
          contains: String(category),
          mode: "insensitive",
        },
      },
    });

    return res.status(200).json(movies);
  } catch (error) {
    console.log(error);
    return res.status(500).end();
  }
}
