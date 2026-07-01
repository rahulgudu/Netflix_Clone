"use client";

import { useSelectionStore } from "@/zustand/states/useSelectStore";
import Image from "next/image";
import { useRouter } from "next/router";
import { AiOutlineDelete } from "react-icons/ai";

type ProfileProps = {
  profile: {
    id: string;
    name: string;
    avatar?: string;
    image?: string;
    isUser?: boolean;
  };
  isManaging?: boolean;
  onDelete?: (id: string) => void;
};

export default function ProfileCard({
  profile,
  isManaging = false,
  onDelete,
}: ProfileProps) {
  const setUser = useSelectionStore((state) => state.setUser);
  const setProfile = useSelectionStore((state) => state.setProfile);
  const router = useRouter();

  const handleSelect = () => {
    if (isManaging) return; // prevent navigation in manage mode

    if (profile.isUser) {
      setUser({
        id: profile.id,
        name: profile.name,
        image: profile.image,
      });
    } else {
      setProfile({
        id: profile.id,
        name: profile.name,
        image: profile.avatar,
      });
    }

    router.push("/");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering handleSelect
    onDelete?.(profile.id);
  };

  return (
    <div
      onClick={handleSelect}
      className="group cursor-pointer flex flex-col items-center"
    >
      <div className="relative w-28 h-28 md:w-36 md:h-36 rounded overflow-hidden border-2 border-transparent group-hover:border-white transition">
        <Image
          src={profile.avatar || profile.image || "/images/default-avatar.png"}
          alt={profile.name}
          fill
          className="object-cover"
        />

        {isManaging && !profile.isUser && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 bg-red-600 p-2 rounded-full hover:bg-red-700 transition"
          >
            <AiOutlineDelete size={18} className="text-white" />
          </button>
        )}
      </div>

      <p className="mt-4 text-gray-400 group-hover:text-white transition">
        {profile.name}
      </p>
    </div>
  );
}