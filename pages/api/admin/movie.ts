import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb";
import signHlsUrl from "@/lib/generateHSL";
import { getUser } from "@/lib/getUser";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== "POST") {
            return res.status(405).end();
        }
        const { email } = req.query;
        const { user: currentUser } = await getUser(email as string);

        if (!currentUser || currentUser.role !== "admin") {
            return res.status(403).end();
        }
        const { title, description, videoId, thumbnailUrl, genre, duration, regionId } = req.body;

        if (!title || !description || !videoId || !thumbnailUrl || !genre || !duration || !regionId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const videoUrl = await signHlsUrl(videoId);
        console.log("videoUrl", videoUrl);


        const movie = await prismadb.movie.create({
            data: {
                title,
                description,
                videoUrl,
                thumbnailUrl,
                genre,
                duration,
                regionId,
            }
        });
        return res.status(200).json("Movie published successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).end()
    }
}