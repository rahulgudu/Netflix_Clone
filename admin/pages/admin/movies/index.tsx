"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Trash2, Pencil, Search, Film, Clock, Tag } from "lucide-react";
import { useToast } from "@/components/Toast";
import useMovieList from "@/hooks/useMovieList";
import useCurrentUser from "@/hooks/useCurrentUser";

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ManageMoviesPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: movieList, isLoading, mutate } = useMovieList();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  const handleDelete = async (movieId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeleting(movieId);
    try {
      await axios.delete(`/api/admin/movie/${movieId}`);
      mutate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete movie. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const filteredMovies = movieList
    ? movieList.filter((movie: any) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-zinc-800/85 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#181818] border border-zinc-800 hover:border-[#e50914] text-white hover:text-[#e50914] transition-all duration-150 shadow-md"
            >
              <AiOutlineArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Manage Movies</h1>
              <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
                {movieList?.length ?? 0} movies on platform
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by title or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-2.5 pl-10 rounded text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-550" />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#181818] border border-zinc-850 rounded-md h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty / Not Found */}
        {!isLoading && filteredMovies.length === 0 && (
          <div className="text-center py-24 bg-[#181818]/40 border border-dashed border-zinc-800 rounded-md">
            <Film size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-500 text-lg font-semibold mb-2">No movies found</p>
            <p className="text-zinc-600 text-sm mb-6">
              {searchTerm ? "Try searching for a different term." : "Click below to upload your first movie."}
            </p>
            <button
              onClick={() => router.push("/admin/add-movies")}
              className="bg-[#e50914] hover:bg-[#b81d24] text-white px-6 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all duration-150 shadow-lg hover:shadow-[#e50914]/10"
            >
              Upload First Movie
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMovies.map((movie: any) => {
              return (
                <div
                  key={movie.id}
                  className="bg-[#181818] rounded-md border border-zinc-850 overflow-hidden hover:border-zinc-700 transition-all duration-200 group flex flex-col shadow-lg shadow-black/35 hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-zinc-950 flex items-center justify-center overflow-hidden">
                    {movie.thumbnailUrl ? (
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-1.5">
                        <Film size={28} />
                        <span className="text-xs uppercase font-bold tracking-wider">No Thumbnail</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-extrabold truncate text-white group-hover:text-[#e50914] transition-colors mb-1">
                      {movie.title}
                    </h3>
                    <p className="text-zinc-550 text-xs line-clamp-2 leading-relaxed mb-4 flex-1">
                      {movie.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-4 bg-zinc-950/40 p-2.5 rounded border border-zinc-850/60">
                      <div className="flex items-center gap-1">
                        <Clock size={13} className="text-[#e50914]" />
                        <span>{movie.duration}</span>
                      </div>
                      <span className="text-zinc-700">|</span>
                      <div className="flex items-center gap-1">
                        <Tag size={13} className="text-[#e50914]" />
                        <span className="truncate max-w-[120px]">{movie.genre}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-850/80 pt-4 mt-auto">
                      <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">
                        Published {timeSince(movie.createdAt)}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/movies/${movie.id}`)}
                          className="flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-white py-2 px-4 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movie.id, movie.title)}
                          disabled={deleting === movie.id}
                          className="flex items-center justify-center gap-1.5 bg-[#e50914]/10 border border-[#e50914]/20 hover:bg-[#e50914] text-[#e50914] hover:text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {deleting === movie.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
