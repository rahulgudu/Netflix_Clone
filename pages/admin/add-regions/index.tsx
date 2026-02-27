"use client";

import { useState } from "react";
import axios from "axios";
import useCurrentUser from "@/hooks/useCurrentUser";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/router";

export default function AdminRegionsPage() {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const { data: currentUser } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post(`/api/admin/region?email=${currentUser?.email}`, { region });
    alert("Region added successfully!");
    setRegion("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="flex items-center mb-8 gap-2">
        <AiOutlineArrowLeft
          onClick={() => router.back()}
          className="text-white cursor-pointer"
          size={20}
        />
        <h1 className="text-3xl font-bold">Add new region</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#141414] p-8 rounded-md space-y-6"
      >
        <input
          type="text"
          placeholder="Region Name (India, US, Europe...)"
          className="w-full bg-black border border-gray-700 p-3"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
        />

        <button className="w-full bg-red-600 hover:bg-red-700 py-3 font-semibold">
          Add Region
        </button>
      </form>
    </div>
  );
}