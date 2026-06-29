"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";

import useGetRegions from "@/hooks/useRegions";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSeriesStore, SeriesEpisode, SeriesSeason, SeriesFormData } from "@/zustand/states/useSeriesStore";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";
import BulkUploadTab from "@/components/BulkUploadTab";

const emptyEpisode = (): SeriesEpisode => ({
  number: 1,
  title: "",
  videoId: "",
  duration: "",
});

const emptyForm: Omit<SeriesFormData, "seasons"> = {
  title: "",
  description: "",
  genre: "",
  regionId: "",
  trailerId: "",
  thumbnailUrl: "",
};

export default function AdminSeriesPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: regionsData } = useGetRegions();

  const {
    seriesData,
    setSeriesData,
    isSubmitting,
    setSubmitting,
    isPublishing,
    setPublishing,
    reset,
  } = useSeriesStore();

  const [form, setForm] = useState(emptyForm);
  const [seasons, setSeasons] = useState<SeriesSeason[]>([
    { number: 1, episodes: [{ ...emptyEpisode() }] },
  ]);
  const [activeTab, setActiveTab] = useState<"manual" | "bulk">("manual");

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (seriesData) {
      setForm({
        title: seriesData.title || "",
        description: seriesData.description || "",
        genre: seriesData.genre || "",
        regionId: seriesData.regionId || "",
        trailerId: seriesData.trailerId || "",
        thumbnailUrl: seriesData.thumbnailUrl || "",
      });
      if (seriesData.seasons?.length) {
        setSeasons(seriesData.seasons);
      }
    }
  }, []);

  const addSeason = () => {
    setSeasons((prev) => [
      ...prev,
      { number: prev.length + 1, episodes: [{ ...emptyEpisode() }] },
    ]);
  };

  const addEpisode = (sIdx: number) => {
    setSeasons((prev) => {
      const next = [...prev];
      next[sIdx] = {
        ...next[sIdx],
        episodes: [
          ...next[sIdx].episodes,
          { ...emptyEpisode(), number: next[sIdx].episodes.length + 1 },
        ],
      };
      return next;
    });
  };

  const updateEpisode = (sIdx: number, eIdx: number, data: Partial<SeriesEpisode>) => {
    setSeasons((prev) => {
      const next = [...prev];
      next[sIdx] = {
        ...next[sIdx],
        episodes: next[sIdx].episodes.map((ep, i) =>
          i === eIdx ? { ...ep, ...data } : ep
        ),
      };
      return next;
    });
  };

  const handleSaveBulk = async (params: {
    isNewSeason: boolean;
    seasonNumber?: number;
    episodes: { title: string; videoId: string; duration: string }[];
  }) => {
    if (params.isNewSeason) {
      const nextNumber = seasons.length + 1;
      setSeasons((prev) => [
        ...prev,
        {
          number: nextNumber,
          episodes: params.episodes.map((ep, idx) => ({
            number: idx + 1,
            title: ep.title,
            videoId: ep.videoId,
            duration: ep.duration,
          })),
        },
      ]);
    } else if (params.seasonNumber) {
      setSeasons((prev) => {
        const next = [...prev];
        const sIdx = params.seasonNumber! - 1;
        const startNum = next[sIdx].episodes.length + 1;
        next[sIdx] = {
          ...next[sIdx],
          episodes: [
            ...next[sIdx].episodes,
            ...params.episodes.map((ep, idx) => ({
              number: startNum + idx,
              title: ep.title,
              videoId: ep.videoId,
              duration: ep.duration,
            })),
          ],
        };
        return next;
      });
    }
    setActiveTab("manual");
  };

  // Phase 1: persist to localStorage
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      setSeriesData({ ...form, seasons });
      alert("Progress saved! You can safely refresh the page.");
    } finally {
      setSubmitting(false);
    }
  };

  // Phase 2: publish to API
  const handlePublish = async () => {
    if (!seriesData) return alert("Please save your progress first.");

    setPublishing(true);
    try {
      const response = await axios.post(
        `/api/admin/series?email=${currentUser?.email}`,
        seriesData
      );
      if (response.status === 200 || response.status === 201) {
        alert("Series published successfully!");
        reset();
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing series.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <AiOutlineArrowLeft onClick={() => router.back()} className="cursor-pointer" size={22} />
          <h1 className="text-3xl font-bold">Upload New Series</h1>
        </div>

        <form onSubmit={handleSaveProgress} className="space-y-10">
          {/* Series Info */}
          <div className="bg-[#141414] p-8 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-red-600 font-bold uppercase text-sm">Series Info</h2>
            <input
              placeholder="Series Title"
              value={form.title}
              className="w-full bg-[#1a1a1a] p-3 rounded-md outline-none"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              className="w-full bg-[#1a1a1a] p-3 rounded-md outline-none h-32"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Genre"
                value={form.genre}
                className="bg-[#1a1a1a] p-3 rounded-md outline-none"
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
              <select
                className="bg-[#1a1a1a] p-3 rounded-md outline-none"
                value={form.regionId}
                onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              >
                <option value="">Select Region</option>
                {regionsData?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.region}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-gray-400 font-bold mb-4 uppercase text-xs">Series Trailer</h2>
                <VideoUploader onSuccess={(id) => setForm({ ...form, trailerId: id })} />
                {form.trailerId && (
                  <p className="text-[10px] text-blue-500 mt-2">Trailer linked: {form.trailerId}</p>
                )}
              </div>
              <div>
                <h2 className="text-gray-400 font-bold mb-4 uppercase text-xs">Series Thumbnail</h2>
                <ImageUploader onSuccess={(url) => setForm({ ...form, thumbnailUrl: url })} />
                {form.thumbnailUrl && (
                  <p className="text-[10px] text-green-500 mt-2">Thumbnail linked ✓</p>
                )}
              </div>
            </div>
          </div>

          {/* Seasons & Episodes */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl font-bold">Seasons & Episodes</h2>
                <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-md border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === "manual"
                        ? "bg-[#e50914] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Manual Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bulk")}
                    className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === "bulk"
                        ? "bg-[#e50914] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Bulk Upload
                  </button>
                </div>
              </div>
              {activeTab === "manual" && (
                <button
                  type="button"
                  onClick={addSeason}
                  className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold"
                >
                  Add Season
                </button>
              )}
            </div>

            {activeTab === "manual" ? (
              seasons.map((season, sIdx) => (
                <div key={sIdx} className="bg-[#141414] p-6 rounded-xl border border-gray-800">
                  <h3 className="text-xl font-bold mb-6">Season {season.number}</h3>

                  <div className="space-y-8">
                    {season.episodes.map((episode, eIdx) => (
                      <div key={eIdx} className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 mb-4 uppercase">Episode {episode.number}</p>
                        <div className="space-y-4">
                          <input
                            placeholder="Episode Title"
                            value={episode.title}
                            className="w-full bg-black p-2 rounded text-sm"
                            onChange={(e) => updateEpisode(sIdx, eIdx, { title: e.target.value })}
                          />
                          <input
                            placeholder="Duration (e.g. 42m)"
                            value={episode.duration}
                            className="w-full bg-black p-2 rounded text-sm"
                            onChange={(e) => updateEpisode(sIdx, eIdx, { duration: e.target.value })}
                          />
                          <VideoUploader
                            onSuccess={(id) => updateEpisode(sIdx, eIdx, { videoId: id })}
                          />
                          {episode.videoId && (
                            <p className="text-[10px] text-blue-500">Video linked: {episode.videoId}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addEpisode(sIdx)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                    >
                      <Plus size={16} /> Add Episode
                    </button>
                  </div>
                </div>
              ))
            ) : (
              currentUser?.email && (
                <BulkUploadTab
                  existingSeasons={seasons.map((s) => ({ number: s.number }))}
                  userEmail={currentUser.email}
                  onSave={handleSaveBulk}
                />
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-700 hover:bg-blue-800 py-4 font-bold rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Progress"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || !seriesData}
              className="flex-1 bg-red-600 hover:bg-red-700 py-4 font-bold rounded-lg transition disabled:opacity-50"
            >
              {isPublishing ? "Publishing..." : "Final Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
