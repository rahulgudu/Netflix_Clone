import { NextApiRequest, NextApiResponse } from "next";


import { getUser } from "@/lib/getUser";
import prismadb from "@/lib/prismadb";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        if (req.method === "POST") {
            const { email } = req.query;
            // const { currentUser } = await serverAuth(req);
            const { user: currentUser } = await getUser(email as string);

            const { region } = req.body;

            if (currentUser?.role !== "admin") {
                return res.status(401).end()
            }
            await prismadb.region.create({
                data: {
                    region
                }
            });

            return res.status(200).json("Region added successfully");
        }


        return res.status(405).end();
    } catch (error) {
        console.log(error);
        return res.status(400).end();
    }
}
