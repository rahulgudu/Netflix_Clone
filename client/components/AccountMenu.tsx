"use client";

import useCurrentUser from "@/hooks/useCurrentUser";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";

interface AccountMenuProps {
  visible?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible }) => {
  const router = useRouter();
  const { user, profile, clear } = useSelectionStore();

  if (!visible) return null;

  const active = profile || user;
  return (
    <div className="absolute right-0 top-14 w-60 bg-black border border-gray-800 rounded-md shadow-lg z-50">
      <div className="flex flex-col py-3">
        {/* Active Profile */}
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 cursor-pointer transition">
          <img
            src={active?.image || "/images/default-avatar.png"}
            alt={active?.name}
            className="w-8 h-8 rounded-md object-cover"
          />
          <span className="text-sm text-white">
            {active?.name || "Profile"}
          </span>
        </div>

        {/* Switch Profiles */}
        <button
          onClick={() => router.push("/profiles")}
          className="text-left px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition">
          Switch Profiles
        </button>

        <div className="border-t border-gray-800 my-2" />

        {/* Sign Out */}
        <button
          onClick={() => {
            signOut();
            clear();
          }}
          className="px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition text-left">
          Sign out of Netflix
        </button>
      </div>
    </div>
  );
};

export default AccountMenu;
