import Input from "@/components/Input";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/admin",
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
  const [isLoading, setIsLoading] = useState(false);

  // Pick up ?error= param set by the index gateway redirect or NextAuth
  useEffect(() => {
    const raw = router.query.error as string | undefined;
    if (!raw) return;

    const errorMap: Record<string, string> = {
      AccessDenied: "You are not an admin. Access denied.",
      CredentialsSignin: "Incorrect email or password.",
      OAuthAccountNotLinked: "This email is already linked to another account.",
    };

    setError(errorMap[raw] ?? decodeURIComponent(raw));
  }, [router.query.error]);


  const login = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (res?.error) {
        const errMap: Record<string, string> = {
          AccessDenied: "You are not an admin. Access denied.",
          CredentialsSignin: "Incorrect email or password.",
          "Access Denied: Admin role required": "You are not an admin. Access denied.",
        };
        setError(errMap[res.error] ?? res.error);
      } else {
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #E50914 0%, transparent 70%)",
            animation: "pulse 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, #E50914 0%, transparent 70%)",
            animation: "pulse 8s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #ff4444 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-extrabold tracking-tighter cursor-pointer select-none"
            style={{ color: "#E50914" }}
          >
            NETFLIX
          </h1>
          <p className="text-zinc-500 text-sm mt-1 tracking-widest uppercase font-medium">
            Admin Portal
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(20, 20, 20, 0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,9,20,0.05)",
          }}
        >
          <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-zinc-500 text-sm mb-7">
            Sign in to your admin account
          </p>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2"
              style={{
                background: "rgba(229, 9, 20, 0.12)",
                border: "1px solid rgba(229, 9, 20, 0.3)",
                color: "#ff6b6b",
              }}
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Inputs */}
          <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
            <Input
              id="email"
              label="Email address"
              type="email"
              onChange={(event: any) => setEmail(event.target.value)}
              value={email}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(event: any) => setPassword(event.target.value)}
            />
          </div>

          {/* Login button */}
          <button
            onClick={login}
            disabled={isLoading || !email || !password}
            className="w-full mt-6 py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isLoading
                ? "rgba(229, 9, 20, 0.7)"
                : "linear-gradient(135deg, #E50914 0%, #c4070f 100%)",
              boxShadow: isLoading
                ? "none"
                : "0 4px 15px rgba(229, 9, 20, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 20px rgba(229, 9, 20, 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 15px rgba(229, 9, 20, 0.3)";
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Social logins */}
          <div className="flex gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/admin" })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-zinc-300 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.05)")
              }
            >
              <FcGoogle size={20} />
              Google
            </button>
            <button
              onClick={() => signIn("github", { callbackUrl: "/admin" })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-zinc-300 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.05)")
              }
            >
              <FaGithub size={20} />
              GitHub
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          Restricted access — authorized admins only
        </p>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;
