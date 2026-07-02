"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Plus, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/router";

import useGetRegions from "@/hooks/useRegions";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSeriesStore, SeriesEpisode, SeriesSeason, SeriesFormData } from "@/zustand/useSeriesStore";
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

  const toast = useToast();

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
      toast.success("Progress saved! You can safely refresh the page.");
    } finally {
      setSubmitting(false);
    }
  };

  // Phase 2: publish to API
  const handlePublish = async () => {
    if (!seriesData) { toast.error("Please save your progress first."); return; }

    setPublishing(true);
    try {
      const response = await axios.post(
        `/api/admin/series?email=${currentUser?.email}`,
        seriesData
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Series published successfully!");
        reset();
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error publishing series. Please try again.");
    } finally {
      setPublishing(false);
    }
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
            <h1 className="text-3xl font-extrabold tracking-tight">Upload New Series</h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
              Add a TV show with seasons and episodes
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProgress} className="space-y-6">

          {/* Series Info Card */}
          <div className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 space-y-6 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
              <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">Series Info</h2>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Series Title</label>
              <input
                placeholder="Series Title"
                value={form.title}
                className={inputCls}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Description</label>
              <textarea
                placeholder="Description"
                value={form.description}
                className={`${inputCls} resize-none`}
                rows={4}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Genre</label>
                <input
                  placeholder="Genre"
                  value={form.genre}
                  className={inputCls}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Region</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                >
                  <option value="">Select Region</option>
                  {regionsData?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`${labelCls} block`}>Series Trailer</label>
                <VideoUploader onSuccess={(id) => setForm({ ...form, trailerId: id })} />
                {form.trailerId && (
                  <p className="text-[10px] text-green-500 font-semibold">Trailer linked ✓</p>
                )}
              </div>
              <div className="space-y-2">
                <label className={`${labelCls} block`}>Series Thumbnail</label>
                {form.thumbnailUrl && (
                  <div className="relative rounded overflow-hidden aspect-video border border-zinc-800 w-full max-h-36 bg-zinc-950">
                    <img src={form.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                  </div>
                )}
                <ImageUploader onSuccess={(url) => setForm({ ...form, thumbnailUrl: url })} />
                {form.thumbnailUrl && (
                  <p className="text-[10px] text-green-500 font-semibold">Thumbnail linked ✓</p>
                )}
              </div>
            </div>
          </div>

          {/* Seasons & Episodes */}
          <div className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 shadow-xl shadow-black/40 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
                  <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">Seasons &amp; Episodes</h2>
                </div>
                <div className="flex gap-1 bg-[#2a2a2a] p-1 rounded border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === "manual" ? "bg-[#e50914] text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bulk")}
                    className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === "bulk" ? "bg-[#e50914] text-white" : "text-zinc-400 hover:text-white"
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
                  className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#333] border border-zinc-700 hover:border-[#e50914] text-white hover:text-[#e50914] px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all"
                >
                  <Plus size={13} /> Add Season
                </button>
              )}
            </div>

            {activeTab === "manual" ? (
              <div className="space-y-6">
                {seasons.map((season, sIdx) => (
                  <div key={sIdx} className="bg-[#141414] rounded border border-zinc-800/60 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 mb-5">
                      Season {season.number}
                    </h3>
                    <div className="space-y-4">
                      {season.episodes.map((episode, eIdx) => (
                        <div key={eIdx} className="bg-[#1e1e1e] p-5 rounded border border-zinc-800/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">
                            Episode {episode.number}
                          </p>
                          <div className="space-y-3">
                            <input
                              placeholder="Episode Title"
                              value={episode.title}
                              className={inputCls}
                              onChange={(e) => updateEpisode(sIdx, eIdx, { title: e.target.value })}
                            />
                            <input
                              placeholder="Duration (e.g. 42m)"
                              value={episode.duration}
                              className={inputCls}
                              onChange={(e) => updateEpisode(sIdx, eIdx, { duration: e.target.value })}
                            />
                            <VideoUploader
                              onSuccess={(id) => updateEpisode(sIdx, eIdx, { videoId: id })}
                            />
                            {episode.videoId && (
                              <p className="text-[10px] text-green-500 font-semibold">Video linked ✓</p>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEpisode(sIdx)}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white uppercase tracking-wider font-bold transition"
                      >
                        <Plus size={14} /> Add Episode
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] border border-zinc-700 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={15} /> Save Progress</>
              )}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || !seriesData}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-800 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 shadow-lg"
            >
              {isPublishing ? (
                <><Loader2 size={15} className="animate-spin" /> Publishing...</>
              ) : (
                <><Save size={15} /> Final Publish</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
