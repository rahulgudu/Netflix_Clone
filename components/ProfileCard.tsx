"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type ProfileProps = {
  profile: {
    id: number;
    name: string;
    avatar?: string;
    image?: string;
  };
};

export default function ProfileCard({ profile }: ProfileProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/")}
      className="group cursor-pointer flex flex-col items-center">
      <div className="relative w-28 h-28 md:w-36 md:h-36 rounded overflow-hidden border-2 border-transparent group-hover:border-white transition">
        <Image
          src={
            profile?.avatar || profile?.image || "/images/default-avatar.png"
          }
          alt={profile?.name}
          fill
          className="object-cover"
        />
      </div>

      <p className="mt-4 text-gray-400 group-hover:text-white transition">
        {profile?.name}
      </p>
    </div>
  );
}
