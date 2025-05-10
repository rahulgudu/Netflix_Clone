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
      <h1 className="text-3xl font-bold text-red-500">Netflix Clone</h1>
      <p className="text-white mt-5 mb-5">
        Logged In as{" "}
        <span
          className="bg-red-500 p-2 text-white rounded-md cursor-pointer"
          onClick={() => {
            router.push("/profiles");
          }}>
          {user?.name}
        </span>
      </p>
      <button className="h-10 w-full bg-white" onClick={() => signOut()}>
        Logout
      </button>
    </>
  );
}
