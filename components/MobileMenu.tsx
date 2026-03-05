import useCurrentUser from "@/hooks/useCurrentUser";
import Link from "next/link";
import React from "react";

interface MobileMenuProps {
  visible: boolean;
}
const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  if (!visible) return null;
  const { data: currentUser } = useCurrentUser();
  return (
    <div className="bg-black w-56 absolute top-8 left-0 py-5 flex flex-col border-2 border-gray-900">
      {currentUser?.role === "admin" && (
        <Link href={"/admin"} className="bg-red-600 py-1 px-2 rounded-md text-center text-white mb-4">
          Admin
        </Link>
      )}
      <div className="flex flex-col gap-4">
        <div className="text-white px-3 text-center hover:underline">Home</div>
        <div className="text-white px-3 text-center hover:underline">
          Series
        </div>
        <div className="text-white px-3 text-center hover:underline">Films</div>
        <div className="text-white px-3 text-center hover:underline">
          Movies
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
