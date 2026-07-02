"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/router";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";
import { useMovieStore } from "@/zustand/useMovieStore";
import useCurrentUser from "@/hooks/useCurrentUser";

const emptyForm = {
  title: "",
  description: "",
  videoId: "",
  thumbnailUrl: "",
  trailerId: "",
  genre: "",
  duration: "",
  regionId: "",
};

export default function AdminMoviesPage() {
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const { movie, setMovie, clearMovie } = useMovieStore();
  const { data: regionsData } = useGetRegions();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (movie) {
      setForm({
        title: movie.title || "",
        description: movie.description || "",
        videoId: movie.videoId || "",
        thumbnailUrl: movie.thumbnailUrl || "",
        trailerId: movie.trailerId || "",
        genre: movie.genre || "",
        duration: movie.duration || "",
        regionId: movie.regionId || "",
      });
    }
  }, [movie]);

  // Phase 1: save uploads + form data into the store
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMovie(form);
    toast.success("Movie data saved! Review and click Publish.");
    setSaving(false);
  };

  // Phase 2: send to API
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;
    setSaving(true);
    const response = await axios.post(
      `/api/admin/movie?email=${currentUser?.email}`,
      movie,
    );
    if (response.status === 201) {
      toast.success("Movie published successfully!");
    }
    clearMovie();
    setForm(emptyForm);
    setSaving(false);
  };

  const inputCls =
    "w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200";
  const labelCls = "text-[10px] font-bold uppercase tracking-wider text-zinc-400";

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10 font-sans">
      <div className="max-w-4xl mx-auto">

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
            <h1 className="text-3xl font-extrabold tracking-tight">Upload New Movie</h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
              Add content to your streaming platform
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={movie ? handlePublish : handleSubmit}
          className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 space-y-6 shadow-xl shadow-black/40"
        >
          {/* Section title */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
            <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">
              Movie Information
            </h2>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelCls}>Movie Title</label>
            <input
              type="text"
              placeholder="Enter movie title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelCls}>Description</label>
            <textarea
              placeholder="Enter movie description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Genre + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelCls}>Genre</label>
              <input
                type="text"
                placeholder="Action, Comedy..."
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Duration</label>
              <input
                type="text"
                placeholder="2h 15m"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                className={inputCls}
              />
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className={labelCls}>Region</label>
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Choose region</option>
              {regionsData?.map(({ id, region }: { id: string; region: string }) => (
                <option key={id} value={id}>{region}</option>
              ))}
            </select>
          </div>

          {/* Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/60">
            <div className="space-y-2">
              <label className={`${labelCls} block`}>Movie Video File</label>
              <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, videoId: id }))} />
              {form.videoId && (
                <p className="text-[10px] text-green-500 font-semibold">Video linked ✓</p>
              )}
            </div>
            <div className="space-y-2">
              <label className={`${labelCls} block`}>Thumbnail Image</label>
              {form.thumbnailUrl && (
                <div className="relative rounded overflow-hidden aspect-video border border-zinc-800 w-full max-h-36 bg-zinc-950">
                  <img src={form.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                </div>
              )}
              <ImageUploader onSuccess={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} />
              {form.thumbnailUrl && (
                <p className="text-[10px] text-green-500 font-semibold">Thumbnail linked ✓</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={`${labelCls} block`}>Trailer Video</label>
              <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, trailerId: id }))} />
              {form.trailerId && (
                <p className="text-[10px] text-green-500 font-semibold">Trailer linked ✓</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-zinc-800/60">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-800 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 shadow-lg"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={15} /> {movie ? "Publish Movie" : "Save Movie"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
