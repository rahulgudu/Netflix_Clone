"use client";

import { useState } from "react";
import AddProfileModal from "./AddProfileModel";

export default function AddProfileButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex flex-col items-center cursor-pointer">
        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center border-2 border-gray-600 text-5xl text-gray-400 group-hover:border-white group-hover:text-white transition">
          +
        </div>
        <p className="mt-4 text-gray-400 group-hover:text-white transition">
          Add Profile
        </p>
      </button>

      <AddProfileModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
