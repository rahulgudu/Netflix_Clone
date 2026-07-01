import Input from "@/components/Input";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

const Auth = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useCallback(async () => {
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.log(err);
      setError("An unexpected error occurred");
    }
  }, [email, password, router]);

  return (
    <div
      className="relative h-full w-full bg-no-repeat bg-center bg-cover"
      style={{
        background: "url(/images/hero.png)",
      }}
    >
      <div className="bg-black w-full h-full lg:bg-opacity-50">
        <nav className="px-12 py-5">
          <img src="/images/logo.png" className="h-36" />
        </nav>
        <div className="flex justify-center -mt-16">
          <div className="bg-black bg-opacity-70 px-16 py-16 self-center mt-2 lg:w-2/5 lg:max-w-md rounded-md w-full">
            <h2 className="text-white text-4xl mb-8 font-semibold">
              Admin Sign In
            </h2>
            {error && (
              <p className="text-red-500 text-sm mb-4 font-semibold">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-4">
              <Input
                id="email"
                label="Email address"
                type="email"
                onChange={(event: any) => {
                  setEmail(event.target.value);
                }}
                value={email}
              />
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(event: any) => {
                  setPassword(event.target.value);
                }}
              />
            </div>
            <button
              onClick={login}
              className="bg-red-600 py-3 text-white rounded-md w-full mt-10 hover:bg-red-700 transition"
            >
              Login
            </button>
            <div className="flex flex-row items-center justify-center gap-4 mt-8">
              <div
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition"
              >
                <FcGoogle size={30} />
              </div>
              <div
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition"
              >
                <FaGithub size={30} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
