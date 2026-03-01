import AddProfileButton from "@/components/AddProfileButton";
import ProfileCard from "@/components/ProfileCard";
import useCurrentUser from "@/hooks/useCurrentUser";
import useGetProfiles from "@/hooks/useGetProfiles";
import axios from "axios";
import { useState } from "react";

export default function ProfilePage() {
  const { data: profiles, mutate } = useGetProfiles();
  const { data: currentUser } = useCurrentUser();

  const [isManaging, setIsManaging] = useState(false);

  const handleDelete = async (profileId: string) => {
    console.log(profileId);

    try {
      await axios.delete(`/api/profiles?profileId=${profileId}`);

      mutate();
    } catch (error) {
      console.error("Failed to delete profile");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-3xl md:text-5xl font-semibold mb-12">
        Who’s watching?
      </h1>

      <div className="flex flex-wrap justify-center gap-8">
        {currentUser && (
          <ProfileCard
            profile={{
              id: currentUser.id,
              name: currentUser.name,
              image: currentUser.image,
              isUser: true,
            }}
            isManaging={isManaging}
            onDelete={handleDelete}
          />
        )}

        {profiles?.map((profile: any) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isManaging={isManaging}
            onDelete={handleDelete}
          />
        ))}

        <AddProfileButton />
      </div>

      <button
        onClick={() => setIsManaging((prev) => !prev)}
        className="mt-16 px-8 py-2 border border-gray-500 text-gray-400 hover:text-white hover:border-white transition">
        {isManaging ? "Done" : "Manage Profiles"}
      </button>
    </div>
  );
}
