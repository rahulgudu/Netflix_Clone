import serverAuth from "@/lib/serverAuth";
import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }
  try {
    await serverAuth(req);
    // await serverAuth(req, res); // for code space
    const { profileId } = req.query;
    console.log("id", profileId);

    const profile = await prismadb.profiles.findUnique({
      where: {
        id: profileId as string,
      },
    });

    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
