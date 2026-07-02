"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Save, Loader2, Film, Image } from "lucide-react";
import { useToast } from "@/components/Toast";
import useMovie from "@/hooks/useMovie";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";

export default function EditMoviePage() {
  const router = useRouter();
  const { movieId } = router.query;
  const { data: movieData, isLoading, mutate } = useMovie(movieId as string);
  const { data: regionsData } = useGetRegions();

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    duration: "",
    regionId: "",
    videoId: "",
    thumbnailUrl: "",
    trailerId: "",
  });

  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (movieData) {
      setForm({
        title: movieData.title || "",
        description: movieData.description || "",
        genre: movieData.genre || "",
        duration: movieData.duration || "",
        regionId: movieData.regionId || "",
        videoId: "",
        thumbnailUrl: movieData.thumbnailUrl || "",
        trailerId: "",
      });
    }
  }, [movieData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/admin/movie/${movieId}`, form);
      mutate();
      toast.success("Movie updated successfully!");
      router.push("/admin/movies");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update movie. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !movieData) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading movie details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b border-zinc-800/80 pb-6">
          <button
            onClick={() => router.push("/admin/movies")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#181818] border border-zinc-800 hover:border-[#e50914] text-white hover:text-[#e50914] transition-all flex-shrink-0 shadow-md"
          >
            <AiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Edit Movie</h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
              Currently Editing: <span className="text-white font-mono">{movieData.title}</span>
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 space-y-6 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
            <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">Movie Information</h2>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Movie Title</label>
            <input
              type="text"
              placeholder="e.g. Inception"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
            <textarea
              placeholder="Movie description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none resize-none transition-all duration-200"
            />
          </div>

          {/* Genre and Duration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Genre</label>
              <input
                type="text"
                placeholder="Action, Sci-Fi..."
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                required
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Duration</label>
              <input
                type="text"
                placeholder="2h 28m"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Region</label>
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200 cursor-pointer text-white"
            >
              <option value="">Select Region</option>
              {regionsData?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.region}</option>
              ))}
            </select>
          </div>

          {/* Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/60">
            {/* Video File */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Movie Video File</label>
              {movieData.videoUrl && (
                <div className="flex items-center gap-2 text-xs text-zinc-450 bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded">
                  <Film size={14} className="text-[#e50914]" />
                  <span className="truncate flex-1 font-mono text-zinc-400">{movieData.videoUrl}</span>
                </div>
              )}
              <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, videoId: id }))} />
              {form.videoId && (
                <p className="text-[10px] text-green-500 font-semibold">New video linked ✓</p>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Thumbnail Image</label>
              {form.thumbnailUrl && (
                <div className="relative rounded overflow-hidden aspect-video border border-zinc-850 w-full max-h-36 bg-zinc-950 flex items-center justify-center shadow-inner">
                  <img src={form.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                </div>
              )}
              <ImageUploader onSuccess={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} />
            </div>

            {/* Trailer */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Trailer Video</label>
              {movieData.trailerUrl && (
                <div className="flex items-center gap-2 text-xs text-zinc-450 bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded mb-1">
                  <Film size={14} className="text-[#e50914]" />
                  <span className="truncate flex-1 font-mono text-zinc-400">{movieData.trailerUrl}</span>
                </div>
              )}
              <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, trailerId: id }))} />
              {form.trailerId && (
                <p className="text-[10px] text-green-500 font-semibold">New trailer linked ✓</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-zinc-800/60">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-800 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 shadow-lg hover:shadow-[#e50914]/10"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={15} /> Save Movie
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
