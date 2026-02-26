"use client";

import { useState } from "react";
import axios from "axios";

export default function AdminRegionsPage() {
  const [region, setRegion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post("/api/admin/regions", { region });
    alert("Region added successfully!");
    setRegion("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Add New Region</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-[#141414] p-8 rounded-md space-y-6"
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