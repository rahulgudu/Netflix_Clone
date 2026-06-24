"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import useSeries from "@/hooks/useSeries";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";

export default function EditSeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data, isLoading, mutate } = useSeries(seriesId as string);
  const { data: regionsData } = useGetRegions();

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    regionId: "",
    trailerId: "",
    thumbnailUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  // New episode form state per season
  const [newEpisodeForms, setNewEpisodeForms] = useState<
    Record<string, { title: string; videoId: string; duration: string }>
  >({});
  const [addingEpisode, setAddingEpisode] = useState<string | null>(null);
  const [addingSeason, setAddingSeason] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        genre: data.genre || "",
        regionId: data.regionId || "",
        trailerId: "",
        thumbnailUrl: data.thumbnailUrl || "",
      });
      // Expand all seasons by default
      const ids = new Set<string>();
      data.seasons?.forEach((s: any) => ids.add(s.id));
      setExpandedSeasons(ids);
    }
  }, [data]);

  const toggleSeason = (id: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Save series info
  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/admin/series/${seriesId}`, form);
      mutate();
      alert("Series info updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  // Add season
  const handleAddSeason = async () => {
    setAddingSeason(true);
    try {
      await axios.post(`/api/admin/series/${seriesId}/season`);
      mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to add season.");
    } finally {
      setAddingSeason(false);
    }
  };

  // Delete season
  const handleDeleteSeason = async (seasonId: string, seasonNumber: number) => {
    if (!confirm(`Delete Season ${seasonNumber} and all its episodes?`)) return;
    try {
      await axios.delete(`/api/admin/series/${seriesId}/season`, {
        data: { seasonId },
      });
      mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to delete season.");
    }
  };

  // Add episode
  const handleAddEpisode = async (seasonId: string) => {
    const ep = newEpisodeForms[seasonId];
    if (!ep?.title || !ep?.videoId || !ep?.duration) {
      return alert("Fill in title, upload video, and add duration.");
    }
    setAddingEpisode(seasonId);
    try {
      await axios.post(`/api/admin/series/${seriesId}/episode`, {
        seasonId,
        title: ep.title,
        videoId: ep.videoId,
        duration: ep.duration,
      });
      setNewEpisodeForms((prev) => ({ ...prev, [seasonId]: { title: "", videoId: "", duration: "" } }));
      mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to add episode.");
    } finally {
      setAddingEpisode(null);
    }
  };

  // Delete episode
  const handleDeleteEpisode = async (episodeId: string) => {
    if (!confirm("Delete this episode?")) return;
    try {
      await axios.delete(`/api/admin/series/${seriesId}/episode`, {
        data: { episodeId },
      });
      mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to delete episode.");
    }
  };

  const getEpisodeForm = (seasonId: string) =>
    newEpisodeForms[seasonId] || { title: "", videoId: "", duration: "" };

  const updateEpisodeForm = (seasonId: string, data: Partial<{ title: string; videoId: string; duration: string }>) => {
    setNewEpisodeForms((prev) => ({
      ...prev,
      [seasonId]: { ...getEpisodeForm(seasonId), ...data },
    }));
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading series...</div>
      </div>
    );
  }

  const seasons = data.seasons ?? [];

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <AiOutlineArrowLeft
            onClick={() => router.push("/admin/manage-series")}
            className="cursor-pointer"
            size={24}
          />
          <div>
            <h1 className="text-3xl font-bold">Edit: {data.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {seasons.length} {seasons.length === 1 ? "season" : "seasons"} &middot;{" "}
              {seasons.reduce((a: number, s: any) => a + (s.episodes?.length ?? 0), 0)} episodes
            </p>
          </div>
        </div>

        {/* Series Info Form */}
        <div className="bg-[#1a1a1a] rounded-xl border border-zinc-800 p-6 mb-8 space-y-4">
          <h2 className="text-red-600 font-bold uppercase text-sm mb-2">Series Info</h2>

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black p-3 rounded-md outline-none"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-black p-3 rounded-md outline-none h-24"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Genre"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="bg-black p-3 rounded-md outline-none"
            />
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              className="bg-black p-3 rounded-md outline-none"
            >
              <option value="">Select Region</option>
              {regionsData?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.region}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-gray-400 font-bold mb-2 uppercase text-xs">Trailer</p>
              {data.trailerUrl ? (
                <p className="text-[10px] text-blue-500 mb-2 truncate max-w-[300px]">Current: {data.trailerUrl}</p>
              ) : null}
              <VideoUploader onSuccess={(id) => setForm({ ...form, trailerId: id })} />
            </div>
            <div>
              <p className="text-gray-400 font-bold mb-2 uppercase text-xs">Thumbnail</p>
              {form.thumbnailUrl ? (
                <img src={form.thumbnailUrl} alt="thumb" className="w-full h-24 object-cover rounded-md mb-2" />
              ) : null}
              <ImageUploader onSuccess={(url) => setForm({ ...form, thumbnailUrl: url })} />
            </div>
          </div>

          <button
            onClick={handleSaveInfo}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Info"}
          </button>
        </div>

        {/* Seasons & Episodes */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">Seasons & Episodes</h2>
            <button
              onClick={handleAddSeason}
              disabled={addingSeason}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition disabled:opacity-50"
            >
              <Plus size={16} /> {addingSeason ? "Adding..." : "Add Season"}
            </button>
          </div>

          {seasons.map((season: any) => {
            const isExpanded = expandedSeasons.has(season.id);
            const epForm = getEpisodeForm(season.id);

            return (
              <div key={season.id} className="bg-[#1a1a1a] rounded-xl border border-zinc-800 overflow-hidden">
                {/* Season Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition"
                  onClick={() => toggleSeason(season.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <h3 className="font-bold">Season {season.number}</h3>
                    <span className="text-xs text-gray-500">
                      {season.episodes?.length ?? 0} episodes
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSeason(season.id, season.number);
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Episodes List */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 p-4 space-y-3">
                    {season.episodes?.map((ep: any) => (
                      <div
                        key={ep.id}
                        className="flex items-center gap-4 bg-black/40 rounded-lg p-3"
                      >
                        <span className="text-xs text-gray-500 w-8">E{ep.number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ep.title}</p>
                          <p className="text-[10px] text-gray-500">{ep.duration}</p>
                        </div>
                        <p className="text-[10px] text-blue-500 truncate max-w-[120px] hidden md:block">
                          {ep.videoUrl}
                        </p>
                        <button
                          onClick={() => handleDeleteEpisode(ep.id)}
                          className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {/* Add Episode Form */}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-3">Add New Episode</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            placeholder="Episode Title"
                            value={epForm.title}
                            onChange={(e) => updateEpisodeForm(season.id, { title: e.target.value })}
                            className="bg-black p-2 rounded text-sm outline-none"
                          />
                          <input
                            placeholder="Duration (e.g. 42m)"
                            value={epForm.duration}
                            onChange={(e) => updateEpisodeForm(season.id, { duration: e.target.value })}
                            className="bg-black p-2 rounded text-sm outline-none"
                          />
                        </div>
                        <VideoUploader
                          onSuccess={(id) => updateEpisodeForm(season.id, { videoId: id })}
                        />
                        {epForm.videoId && (
                          <p className="text-[10px] text-blue-500">Video linked: {epForm.videoId}</p>
                        )}
                        <button
                          onClick={() => handleAddEpisode(season.id)}
                          disabled={addingEpisode === season.id}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          <Plus size={14} />
                          {addingEpisode === season.id ? "Adding..." : "Add Episode"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {seasons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No seasons yet. Add one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
