import { NextApiRequest, NextApiResponse } from "next";
import signHlsUrl from "@/lib/generateHSL";
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    await serverAuth(req);

    const { videoId } = req.query;
    if (typeof videoId !== "string" || !videoId) {
      return res.status(400).json({ message: "Invalid videoId" });
    }

    const url = await signHlsUrl(videoId);
    return res.status(200).json({ url });
  } catch (error) {
    console.log(error);
    return res.status(500).end();
  }
}
