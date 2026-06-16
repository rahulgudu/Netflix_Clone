"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/router";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";
import { useMovieStore } from "@/zustand/states/useMovieStore";
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
    setMovie(form);
    alert("Movie data saved! Review and click Publish.");
  };

  // Phase 2: send to API
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;

    const response = await axios.post(
      `/api/admin/movie?email=${currentUser?.email}`,
      movie,
    );
    if (response.status === 201) {
      alert("Movie published successfully!");
    }
    clearMovie();
    setForm(emptyForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <AiOutlineArrowLeft
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition cursor-pointer"
            size={22}
          />
          <div>
            <h1 className="text-4xl font-bold tracking-wide">Upload New Movie</h1>
            <p className="text-gray-500 text-sm mt-1">Add content to your streaming platform</p>
          </div>
        </div>

        <form
          onSubmit={movie ? handlePublish : handleSubmit}
          className="bg-[#141414]/80 backdrop-blur-md border border-gray-800 p-10 rounded-2xl space-y-8 shadow-2xl"
        >
          <div>
            <label className="block mb-2 text-sm text-gray-400">Movie Title</label>
            <input
              type="text"
              placeholder="Enter movie title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Description</label>
            <textarea
              placeholder="Enter movie description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
            />
          </div>

          <div>
            <label className="block mb-4 text-sm text-gray-400">Upload Video</label>
            <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, videoId: id }))} />
            {form.videoId && (
              <p className="text-[10px] text-blue-500 mt-2">Video linked: {form.videoId}</p>
            )}
          </div>

          <div>
            <label className="block mb-4 text-sm text-gray-400">Upload Thumbnail</label>
            <ImageUploader onSuccess={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} />
            {form.thumbnailUrl && (
              <p className="text-[10px] text-green-500 mt-2">Thumbnail linked ✓</p>
            )}
          </div>

          <div>
            <label className="block mb-4 text-sm text-gray-400">Upload Trailer</label>
            <VideoUploader onSuccess={(id) => setForm((f) => ({ ...f, trailerId: id }))} />
            {form.trailerId && (
              <p className="text-[10px] text-blue-500 mt-2">Trailer linked: {form.trailerId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm text-gray-400">Genre</label>
              <input
                type="text"
                placeholder="Action, Comedy..."
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                required
                className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-400">Duration</label>
              <input
                type="text"
                placeholder="2h 15m"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Select Region</label>
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
            >
              <option value="">Choose region</option>
              {regionsData?.map(({ id, region }: { id: string; region: string }) => (
                <option key={id} value={id}>{region}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all py-3 font-semibold rounded-lg shadow-lg shadow-red-900/30"
          >
            {movie ? "Publish Movie" : "Save Movie"}
          </button>
        </form>
      </div>
    </div>
  );
}
