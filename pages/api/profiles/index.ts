import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb";
import serverAuth  from "@/lib/serverAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      // const {currentUser: user} = await serverAuth(req)
      const user = await serverAuth(req, res);

      const profiles = await prismadb.profiles.findMany({
        where: {
          userId: user?.id,
        },
      });

      console.log(profiles);

      return res.status(200).json(profiles);
    }
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
