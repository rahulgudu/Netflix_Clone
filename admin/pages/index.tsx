import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prismadb from "@/lib/prismadb";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.email) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const user = await prismadb.user.findUnique({
    where: { email: session.user.email },
  });

  if (user?.role !== "admin") {
    return {
      redirect: {
        destination: "/auth?error=Access Denied: Admin role required",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/admin",
      permanent: false,
    },
  };
}

export default function HomeGateway() {
  return null;
}
