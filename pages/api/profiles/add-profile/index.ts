import { getUser } from "@/lib/getUser";
import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      const { user: currentUser } = await getUser(req.query.email as string);
      const { name, avatar } = req.body;
      const profile = await prismadb.profiles.create({
        data: {
          name,
          avatar,
          favouriteIds: [],
          userId: currentUser?.id,
        },
      });

      return res.status(200).json({
        message: "Profile created successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(400).end();
    }
  } else {
    return res.status(405).end();
  }
};
export default handler;
