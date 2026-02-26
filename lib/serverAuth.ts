// import { NextApiRequest } from "next";
// import { getSession } from "next-auth/react";
// import prismadb from "@/lib/prismadb";
// const serverAuth = async (req: NextApiRequest) => {
//   const session = await getSession({ req });
//   console.log(session);
  

//   if (!session?.user?.email) {
//     throw new Error("Not signed in");
//   }
//   const currentUser = await prismadb.user.findUnique({
//     where: {
//       email: session?.user?.email,
//     },
//   });

//   if (!currentUser) {
//     throw new Error("Not signed in");
//   }
//   return { currentUser };
// };

// export default serverAuth;


// for code space
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/lib/prismadb";

export default async function serverAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }

  const currentUser = await prismadb.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    res.status(404).json({ error: "User not found" });
    return null;
  }

  return currentUser;
}