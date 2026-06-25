"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Upload, CheckCircle2, XCircle, Loader2, FilePlus2 } from "lucide-react";
import useSeries from "@/hooks/useSeries";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";
import useCurrentUser from "@/hooks/useCurrentUser";
import * as tus from "tus-js-client";

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "authorizing" | "uploading" | "done" | "error";

interface EpisodeRow {
  id: string; // local UUID for tracking
  title: string;
  duration: string;
  file: File | null;
  videoId: string;
  progress: number;
  status: UploadStatus;
  errorMsg?: string;
}

function makeRow(): EpisodeRow {
  return {
    id: Math.random().toString(36).slice(2),
    title: "",
    duration: "",
    file: null,
    videoId: "",
    progress: 0,
    status: "idle",
  };
}

// ── Per-row uploader ──────────────────────────────────────────────────────────
function EpisodeRowCard({
  row,
  index,
  userEmail,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: EpisodeRow;
  index: number;
  userEmail: string;
  onUpdate: (id: string, patch: Partial<EpisodeRow>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  const startUpload = useCallback(
    async (file: File) => {
      onUpdate(row.id, { file, status: "authorizing", progress: 0, videoId: "", errorMsg: undefined });

      try {
        const res = await fetch(`/api/admin/create-upload?email=${userEmail}`, {
          method: "POST",
          body: JSON.stringify({ title: file.name }),
          headers: { "Content-Type": "application/json" },
        });
        const { videoId, libraryId, expires, signature } = await res.json();

        onUpdate(row.id, { status: "uploading" });

        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: expires,
            VideoId: videoId,
            LibraryId: libraryId,
          },
          onProgress: (uploaded, total) => {
            onUpdate(row.id, { progress: Math.round((uploaded / total) * 100) });
          },
          onSuccess: () => {
            onUpdate(row.id, { status: "done", videoId, progress: 100 });
          },
          onError: (err) => {
            console.error(err);
            onUpdate(row.id, { status: "error", errorMsg: "Upload failed. Try again." });
          },
        });

        uploadRef.current = upload;
        upload.start();
      } catch (err) {
        onUpdate(row.id, { status: "error", errorMsg: "Authorization failed." });
      }
    },
    [row.id, userEmail, onUpdate]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
  };

  const statusIcon = () => {
    if (row.status === "authorizing" || row.status === "uploading")
      return <Loader2 size={15} className="animate-spin text-blue-400" />;
    if (row.status === "done") return <CheckCircle2 size={15} className="text-green-400" />;
    if (row.status === "error") return <XCircle size={15} className="text-red-400" />;
    return null;
  };

  const isUploading = row.status === "authorizing" || row.status === "uploading";
  const isDone = row.status === "done";

  return (
    <div className="group relative bg-[#111] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-600">
      {/* Episode number badge */}
      <div className="flex items-start gap-4 p-4">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-zinc-400">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Title + Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                Episode Title <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. The Beginning"
                value={row.title}
                onChange={(e) => onUpdate(row.id, { title: e.target.value })}
                className="w-full bg-black border border-zinc-800 focus:border-zinc-600 px-3 py-2 rounded-lg text-sm outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. 42m or 1h 5m"
                value={row.duration}
                onChange={(e) => onUpdate(row.id, { duration: e.target.value })}
                className="w-full bg-black border border-zinc-800 focus:border-zinc-600 px-3 py-2 rounded-lg text-sm outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Video upload area */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
              Video File <span className="text-red-500">*</span>
            </label>

            {isDone ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-green-400 text-sm font-medium">Upload complete</p>
                  <p className="text-zinc-500 text-[10px] font-mono truncate">{row.file?.name}</p>
                </div>
                <button
                  onClick={() => {
                    onUpdate(row.id, { status: "idle", videoId: "", progress: 0, file: null });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-auto text-zinc-500 hover:text-white text-xs underline flex-shrink-0"
                >
                  Replace
                </button>
              </div>
            ) : isUploading ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={14} className="animate-spin text-blue-400 flex-shrink-0" />
                  <span className="text-blue-400 text-sm font-medium">
                    {row.status === "authorizing" ? "Authorizing..." : `Uploading... ${row.progress}%`}
                  </span>
                  <span className="ml-auto text-zinc-600 text-xs">{row.file?.name}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${row.progress}%` }}
                  />
                </div>
              </div>
            ) : row.status === "error" ? (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{row.errorMsg}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-auto text-zinc-400 hover:text-white text-xs underline flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 hover:bg-zinc-900/50 transition-all duration-200 group/drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} className="text-zinc-600 group-hover/drop:text-zinc-400 mb-1 transition-colors" />
                <p className="text-xs text-zinc-600 group-hover/drop:text-zinc-400 transition-colors">
                  Click to select video file
                </p>
              </label>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Remove button */}
        {canRemove && (
          <button
            onClick={() => onRemove(row.id)}
            disabled={isUploading}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed mt-1"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Active upload progress stripe */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-zinc-800 w-full">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${row.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Bulk Episode Upload Panel ──────────────────────────────────────────────────
function BulkEpisodePanel({
  seasonId,
  seriesId,
  seasonNumber,
  userEmail,
  onSuccess,
}: {
  seasonId: string;
  seriesId: string;
  seasonNumber: number;
  userEmail: string;
  onSuccess: () => void;
}) {
  const [rows, setRows] = useState<EpisodeRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const updateRow = useCallback((id: string, patch: Partial<EpisodeRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, makeRow()]);
  };

  const allDone = rows.every((r) => r.status === "done");
  const anyUploading = rows.some(
    (r) => r.status === "authorizing" || r.status === "uploading"
  );
  const isValid =
    allDone && rows.every((r) => r.title.trim() && r.duration.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      await axios.post(`/api/admin/series/${seriesId}/bulk-episode`, {
        seasonId,
        episodes: rows.map((r) => ({
          title: r.title.trim(),
          videoId: r.videoId,
          duration: r.duration.trim(),
        })),
      });
      setSubmitResult({ ok: true, msg: `${rows.length} episode(s) added successfully!` });
      setRows([makeRow()]);
      onSuccess();
    } catch (err: any) {
      setSubmitResult({
        ok: false,
        msg: err?.response?.data?.message || "Failed to save episodes.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-zinc-800/60">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilePlus2 size={16} className="text-red-500" />
          <span className="text-sm font-bold text-white/80 uppercase tracking-wider">
            Add Episodes
          </span>
          <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
            {rows.length} queued
          </span>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-all duration-150"
        >
          <Plus size={13} />
          Add Another
        </button>
      </div>

      {/* Upload hint */}
      <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
        Upload videos for all episodes simultaneously. Once all uploads are complete, click <strong className="text-zinc-400">Save All Episodes</strong> to add them to the season.
      </p>

      {/* Episode rows */}
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <EpisodeRowCard
            key={row.id}
            row={row}
            index={idx}
            userEmail={userEmail}
            onUpdate={updateRow}
            onRemove={removeRow}
            canRemove={rows.length > 1}
          />
        ))}
      </div>

      {/* Status summary */}
      <div className="mt-4 flex flex-wrap gap-3 items-center text-xs text-zinc-500">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-1">
            <span className="text-zinc-600">E{i + 1}</span>
            {r.status === "done" && <CheckCircle2 size={12} className="text-green-400" />}
            {(r.status === "authorizing" || r.status === "uploading") && (
              <><Loader2 size={12} className="animate-spin text-blue-400" /><span className="text-blue-400">{r.progress}%</span></>
            )}
            {r.status === "error" && <XCircle size={12} className="text-red-400" />}
            {r.status === "idle" && <span className="text-zinc-700">—</span>}
          </div>
        ))}
      </div>

      {/* Submit result */}
      {submitResult && (
        <div
          className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border ${
            submitResult.ok
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {submitResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {submitResult.msg}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting || anyUploading}
        className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 w-full justify-center"
      >
        {submitting ? (
          <><Loader2 size={15} className="animate-spin" /> Saving...</>
        ) : anyUploading ? (
          <><Loader2 size={15} className="animate-spin text-blue-300" /> Uploading...</>
        ) : !allDone ? (
          <><Upload size={15} /> Upload all videos first</>
        ) : (
          <><Save size={15} /> Save {rows.length} Episode{rows.length !== 1 ? "s" : ""} to Season {seasonNumber}</>
        )}
      </button>
    </div>
  );
}

// ── Main edit page ─────────────────────────────────────────────────────────────
export default function EditSeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data, isLoading, mutate } = useSeries(seriesId as string);
  const { data: regionsData } = useGetRegions();
  const { data: currentUser } = useCurrentUser();

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

  const handleAddSeason = async () => {
    setAddingSeason(true);
    try {
      await axios.post(`/api/admin/series/${seriesId}/season`);
      mutate();
    } catch (err) {
      alert("Failed to add season.");
    } finally {
      setAddingSeason(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string, seasonNumber: number) => {
    if (!confirm(`Delete Season ${seasonNumber} and all its episodes?`)) return;
    try {
      await axios.delete(`/api/admin/series/${seriesId}/season`, { data: { seasonId } });
      mutate();
    } catch {
      alert("Failed to delete season.");
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!confirm("Delete this episode?")) return;
    try {
      await axios.delete(`/api/admin/series/${seriesId}/episode`, { data: { episodeId } });
      mutate();
    } catch {
      alert("Failed to delete episode.");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading series...</p>
        </div>
      </div>
    );
  }

  const seasons = data.seasons ?? [];
  const totalEpisodes = seasons.reduce(
    (a: number, s: any) => a + (s.episodes?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.push("/admin/manage-series")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors flex-shrink-0"
          >
            <AiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{data.title}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {seasons.length} {seasons.length === 1 ? "season" : "seasons"} &middot; {totalEpisodes} episodes
            </p>
          </div>
        </div>

        {/* ── Series Info ── */}
        <div className="bg-[#111] rounded-2xl border border-zinc-800 p-6 mb-8 space-y-4">
          <h2 className="text-red-500 font-black uppercase text-xs tracking-[0.15em] mb-4">Series Info</h2>

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black border border-zinc-800 focus:border-zinc-600 px-4 py-2.5 rounded-lg outline-none transition-colors"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-black border border-zinc-800 focus:border-zinc-600 px-4 py-2.5 rounded-lg outline-none h-24 resize-none transition-colors"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Genre"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="bg-black border border-zinc-800 focus:border-zinc-600 px-4 py-2.5 rounded-lg outline-none transition-colors"
            />
            <select
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              className="bg-black border border-zinc-800 focus:border-zinc-600 px-4 py-2.5 rounded-lg outline-none transition-colors text-white"
            >
              <option value="">Select Region</option>
              {regionsData?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.region}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/60">
            <div>
              <p className="text-zinc-500 font-bold mb-2 uppercase text-[10px] tracking-wider">Trailer</p>
              {data.trailerUrl && (
                <p className="text-[10px] text-blue-500 mb-2 truncate">Current: {data.trailerUrl}</p>
              )}
              <VideoUploader onSuccess={(id) => setForm({ ...form, trailerId: id })} />
            </div>
            <div>
              <p className="text-zinc-500 font-bold mb-2 uppercase text-[10px] tracking-wider">Thumbnail</p>
              {form.thumbnailUrl && (
                <img src={form.thumbnailUrl} alt="thumb" className="w-full h-24 object-cover rounded-lg mb-2" />
              )}
              <ImageUploader onSuccess={(url) => setForm({ ...form, thumbnailUrl: url })} />
            </div>
          </div>

          <button
            onClick={handleSaveInfo}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-150"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Info"}
          </button>
        </div>

        {/* ── Seasons & Episodes ── */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black tracking-tight">Seasons & Episodes</h2>
            <button
              onClick={handleAddSeason}
              disabled={addingSeason}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-100 active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <Plus size={15} /> {addingSeason ? "Adding..." : "Add Season"}
            </button>
          </div>

          {seasons.map((season: any) => {
            const isExpanded = expandedSeasons.has(season.id);

            return (
              <div key={season.id} className="bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden">
                {/* Season header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => toggleSeason(season.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    <div>
                      <h3 className="font-bold">Season {season.number}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {season.episodes?.length ?? 0} episodes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSeason(season.id, season.number);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Season body */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/60 px-5 pb-6 pt-4">
                    {/* Existing episodes */}
                    {season.episodes?.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        {season.episodes.map((ep: any) => (
                          <div
                            key={ep.id}
                            className="flex items-center gap-4 bg-black/30 border border-zinc-800/40 rounded-xl px-4 py-3 group"
                          >
                            <span className="text-xs text-zinc-600 font-bold w-6 flex-shrink-0">E{ep.number}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ep.title}</p>
                              <p className="text-[10px] text-zinc-600 mt-0.5">{ep.duration}</p>
                            </div>
                            <p className="text-[10px] text-blue-500/60 truncate max-w-[140px] hidden md:block font-mono">
                              {ep.videoUrl?.slice(0, 40)}...
                            </p>
                            <button
                              onClick={() => handleDeleteEpisode(ep.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 duration-200 flex-shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-700 text-sm mb-4">No episodes yet.</p>
                    )}

                    {/* Bulk upload panel */}
                    {currentUser?.email && (
                      <BulkEpisodePanel
                        seasonId={season.id}
                        seriesId={seriesId as string}
                        seasonNumber={season.number}
                        userEmail={currentUser.email}
                        onSuccess={mutate}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {seasons.length === 0 && (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl text-zinc-600">
              <p className="text-sm">No seasons yet.</p>
              <p className="text-xs mt-1">Click "Add Season" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
