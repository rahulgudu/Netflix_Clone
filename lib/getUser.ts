import prismadb from "@/lib/prismadb";
export const getUser = async (email: string) => {
  const user = await prismadb.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return { user };
};
