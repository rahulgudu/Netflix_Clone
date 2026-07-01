"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Trash2, Pencil } from "lucide-react";
import useSeriesList from "@/hooks/useSeriesList";
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

function isNewlyAdded(dateStr: string) {
  const days = (Date.now() - new Date(dateStr).getTime()) / 86400000;
  return days <= 7;
}

export default function ManageSeriesPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: seriesList, isLoading, mutate } = useSeriesList();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (seriesId: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its seasons/episodes? This cannot be undone.`)) return;

    setDeleting(seriesId);
    try {
      await axios.delete(`/api/admin/series/${seriesId}`);
      mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to delete series.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <AiOutlineArrowLeft
            onClick={() => router.push("/admin")}
            className="cursor-pointer hover:text-gray-300 transition"
            size={24}
          />
          <div>
            <h1 className="text-3xl font-bold">Manage Series</h1>
            <p className="text-gray-500 text-sm mt-1">
              {seriesList?.length ?? 0} series on platform
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!seriesList || seriesList.length === 0) && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No series found</p>
            <button
              onClick={() => router.push("/admin/add-series")}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Upload First Series
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {seriesList && seriesList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seriesList.map((series: any) => {
              const seasonCount = series.seasons?.length ?? 0;
              const episodeCount =
                series.seasons?.reduce(
                  (acc: number, s: any) => acc + (s.episodes?.length ?? 0),
                  0
                ) ?? 0;

              return (
                <div
                  key={series.id}
                  className="bg-[#1a1a1a] rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-zinc-900">
                    {series.thumbnailUrl ? (
                      <img
                        src={series.thumbnailUrl}
                        alt={series.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
                        No Thumbnail
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                      {isNewlyAdded(series.createdAt) && (
                        <span className="bg-red-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                          New
                        </span>
                      )}
                      {series.lastModifiedNote && (
                        <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">
                          {series.lastModifiedNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold truncate mb-1">{series.title}</h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                      {series.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      <span>{seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}</span>
                      <span className="text-zinc-600">|</span>
                      <span>{episodeCount} {episodeCount === 1 ? "Episode" : "Episodes"}</span>
                      {series.genre && (
                        <>
                          <span className="text-zinc-600">|</span>
                          <span>{series.genre}</span>
                        </>
                      )}
                    </div>

                    <p className="text-[10px] text-zinc-600 mb-4">
                      Added {timeSince(series.createdAt)}
                      {series.updatedAt !== series.createdAt && (
                        <> &middot; Updated {timeSince(series.updatedAt)}</>
                      )}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/manage-series/${series.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-lg text-sm font-semibold transition"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(series.id, series.title)}
                        disabled={deleting === series.id}
                        className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        {deleting === series.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
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
