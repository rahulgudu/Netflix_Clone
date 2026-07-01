import bcrypt from "bcrypt";
import { error } from "console";
import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "../../lib/prismadb";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }
  try {
    const { username, email, password } = req.body;
    const isExist = await prismadb.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isExist) {
      return res.status(422).json({
        error: "Email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const user = await prismadb.user.create({
      data: {
        name: username,
        email: email,
        hashedPassword: hashPassword,
        image: "",
        emailVerified: new Date(),
      },
    });
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}
