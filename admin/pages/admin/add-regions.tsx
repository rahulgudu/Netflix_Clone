"use client";

import { useState } from "react";
import axios from "axios";
import useCurrentUser from "@/hooks/useCurrentUser";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/router";

export default function AdminRegionsPage() {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { data: currentUser } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await axios.post(`/api/admin/region?email=${currentUser?.email}`, { region });
    toast.success("Region added successfully!");
    setRegion("");
    setSaving(false);
  };

  const inputCls =
    "w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200";
  const labelCls = "text-[10px] font-bold uppercase tracking-wider text-zinc-400";

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10 font-sans">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b border-zinc-800/80 pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#181818] border border-zinc-800 hover:border-[#e50914] text-white hover:text-[#e50914] transition-all flex-shrink-0 shadow-md"
          >
            <AiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Add Region</h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
              Create a new regional category
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 space-y-6 shadow-xl shadow-black/40"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
            <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">
              Region Details
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Region Name</label>
            <input
              type="text"
              placeholder="India, US, Europe..."
              className={inputCls}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 border-t border-zinc-800/60">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-800 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 shadow-lg"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={15} /> Add Region</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}