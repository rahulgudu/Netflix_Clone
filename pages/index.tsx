import Billboard from "@/components/Billboard";
import Navbar from "@/components/Navbar";
import useCurrentUser from "@/hooks/useCurrentUser";
import { NextPageContext } from "next";
import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
export default function Home() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  return (
    <>
      <Navbar />
      <Billboard />
    </>
  );
}
