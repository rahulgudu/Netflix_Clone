"use client";

import useCurrentUser from "@/hooks/useCurrentUser";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  visible?: boolean;
  onClose: () => void;
};

export default function AddProfileModal({ visible, onClose }: Props) {
  const { data: user } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(!!visible);
  const [name, setName] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    "/images/default-avatar.png",
  );

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  // Generate fallback avatar URL
  const fallbackAvatar = name
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${name[0].toUpperCase()}`
    : "";

  // Handle image upload
  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (!name.trim() || isLoading) return;

    try {
      setIsLoading(true);

      const profileData = {
        name,
        isKids,
        avatar: avatarFile || fallbackAvatar,
      };

      await axios.post(
        `/api/profiles/add-profile?email=${user?.email}`,
        profileData,
      );

      // Reset
      setName("");
      setIsKids(false);
      setAvatarFile(null);
      setPreview("/images/default-avatar.png");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-[#141414] text-white rounded-md p-6 animate-fadeIn">
        <h2 className="text-2xl font-semibold mb-2">Add Profile</h2>
        <p className="text-gray-400 mb-6">
          Add a profile for another person watching Netflix.
        </p>

        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-20 h-20 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
            {preview || fallbackAvatar ? (
              <Image
                src={preview || fallbackAvatar}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-3xl font-bold">?</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className={`text-sm cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : "text-gray-400"}`}>
              Upload avatar
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={isLoading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setIsLoading(true);
                  const url = await uploadToCloudinary(file);
                  setAvatarFile(url);
                  setPreview(url);
                  setIsLoading(false);
                }}
              />
            </label>

            <input
              type="text"
              placeholder="Profile Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black border border-gray-600 px-4 py-2 outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Kids Toggle */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={isKids}
            onChange={() => setIsKids(!isKids)}
            className="w-4 h-4 accent-white"
          />
          <span>Kids Profile</span>
        </label>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-6 py-2 font-semibold transition flex items-center justify-center gap-2
            ${
              isLoading
                ? "bg-gray-300 text-black cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}>
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className={`border px-6 py-2 transition
            ${
              isLoading
                ? "border-gray-700 text-gray-600 cursor-not-allowed"
                : "border-gray-500 text-gray-400 hover:text-white hover:border-white"
            }`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
