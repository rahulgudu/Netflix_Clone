import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb";
import serverAuth from "@/lib/serverAuth";
import { getUser } from "@/lib/getUser";
import { deleteFromCloudinary } from "@/lib/deleteFromCloudinary";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method === "GET") {
      const { currentUser: user } = await serverAuth(req);
      // const user = await serverAuth(req, res);

      const profiles = await prismadb.profiles.findMany({
        where: {
          userId: user?.id,
        },
      });

      console.log(profiles);

      return res.status(200).json(profiles);
    }
    if (req.method === "DELETE") {
      const { profileId } = req.query;
      const profile =await prismadb.profiles.delete({
        where: {
          id: profileId as string,
        },
      });
      deleteFromCloudinary(profile.avatar)
      return res.status(200).end();
    }
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
