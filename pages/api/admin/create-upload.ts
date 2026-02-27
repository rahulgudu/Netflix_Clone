import { getUser } from "@/lib/getUser";
import axios from "axios";
import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        if (req.method !== "POST") {
            return res.status(405).end();
        }

        const { title } = req.body;
        const { email } = req.query;

        const { user: currentUser } = await getUser(email as string);

        if (currentUser?.role !== "admin") {
            return res.status(401).end();
        }

        const libraryId = process.env.BUNNY_LIBRARY_ID!.trim();
        const apiKey = process.env.BUNNY_API_KEY!.trim();

        console.log("api keys", libraryId, apiKey);


        const videoResponse = await axios.post(
            `https://video.bunnycdn.com/library/${libraryId}/videos`,
            { title },
            {
                headers: {
                    AccessKey: apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        const videoId = videoResponse.data.guid;

        const expires = Math.floor(Date.now() / 1000) + 3600;

        const signature = crypto
            .createHash("sha256")
            .update(libraryId + apiKey + expires + videoId)
            .digest("hex");

        return res.json({
            videoId,
            libraryId,
            signature,
            expires,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to initialize upload" });
    }
}