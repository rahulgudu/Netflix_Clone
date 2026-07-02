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
    <div className="bg-black w-56 absolute top-8 left-0 py-5 flex flex-col border-2 border-gray-900 z-50">
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-white px-3 text-center hover:underline block">
          Home
        </Link>
        <Link href="/series" className="text-white px-3 text-center hover:underline block">
          Series
        </Link>
        <Link href="/movies" className="text-white px-3 text-center hover:underline block">
          Movies
        </Link>
        <Link href="/my-list" className="text-white px-3 text-center hover:underline block">
          My List
        </Link>
        
        <div className="border-t border-zinc-800 my-2 pt-2">
          <p className="text-zinc-500 text-xs uppercase px-3 mb-2 font-semibold text-center">Categories</p>
          <div className="flex flex-col gap-3">
            <Link href="/category/drama" className="text-white px-3 text-center hover:underline block">
              Drama
            </Link>
            <Link href="/category/comedy" className="text-white px-3 text-center hover:underline block">
              Comedy
            </Link>
            <Link href="/category/romance" className="text-white px-3 text-center hover:underline block">
              Romance
            </Link>
            <Link href="/category/thriller" className="text-white px-3 text-center hover:underline block">
              Thriller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
