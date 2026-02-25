import AddProfileButton from "@/components/AddProfileButton";
import ProfileCard from "@/components/ProfileCard";
import useCurrentUser from "@/hooks/useCurrentUser";
import useGetProfiles from "@/hooks/useGetProfiles";

export default function ProfilePage() {
  const { data: profiles } = useGetProfiles();
  const { data: currentUser } = useCurrentUser();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-3xl md:text-5xl font-semibold mb-12">
        Who’s watching?
      </h1>

      <div className="flex flex-wrap justify-center gap-8">
        <ProfileCard profile={currentUser} />
        {profiles?.map((profile: any) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
        <AddProfileButton />
      </div>

      <button className="mt-16 px-8 py-2 border border-gray-500 text-gray-400 hover:text-white hover:border-white transition">
        Manage Profiles
      </button>
    </div>
  );
}
