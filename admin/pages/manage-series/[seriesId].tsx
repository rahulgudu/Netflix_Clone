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
import BulkUploadTab from "@/components/BulkUploadTab";

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

  const isUploading = row.status === "authorizing" || row.status === "uploading";
  const isDone = row.status === "done";

  return (
    <div className="group relative bg-[#1f1f1f] border border-zinc-800 hover:border-zinc-700 rounded-md overflow-hidden transition-all duration-200">
      <div className="flex items-start gap-4 p-5">
        {/* Episode number badge */}
        <div className="w-8 h-8 rounded-full bg-[#e50914] text-white flex items-center justify-center flex-shrink-0 mt-1 text-xs font-extrabold shadow-md">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Title + Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Episode Title <span className="text-[#e50914]">*</span>
              </label>
              <input
                placeholder="e.g. The Beginning"
                value={row.title}
                onChange={(e) => onUpdate(row.id, { title: e.target.value })}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-2.5 rounded text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Duration <span className="text-[#e50914]">*</span>
              </label>
              <input
                placeholder="e.g. 42m or 1h 5m"
                value={row.duration}
                onChange={(e) => onUpdate(row.id, { duration: e.target.value })}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-2.5 rounded text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Video upload area */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Video File <span className="text-[#e50914]">*</span>
            </label>

            {isDone ? (
              <div className="flex items-center gap-3 bg-[#46d369]/10 border border-[#46d369]/30 rounded px-4 py-3.5">
                <CheckCircle2 size={18} className="text-[#46d369] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#46d369] text-sm font-bold">Upload complete</p>
                  <p className="text-zinc-500 text-[10px] font-mono truncate mt-0.5">{row.file?.name}</p>
                </div>
                <button
                  onClick={() => {
                    onUpdate(row.id, { status: "idle", videoId: "", progress: 0, file: null });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-zinc-400 hover:text-white text-xs underline font-medium flex-shrink-0"
                >
                  Replace
                </button>
              </div>
            ) : isUploading ? (
              <div className="bg-zinc-950 border border-zinc-850 rounded px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Loader2 size={15} className="animate-spin text-[#e50914] flex-shrink-0" />
                  <span className="text-[#e50914] text-sm font-semibold">
                    {row.status === "authorizing" ? "Authorizing..." : `Uploading... ${row.progress}%`}
                  </span>
                  <span className="ml-auto text-zinc-500 text-xs font-mono truncate max-w-[200px]">{row.file?.name}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#e50914] h-full rounded-full transition-all duration-300"
                    style={{ width: `${row.progress}%` }}
                  />
                </div>
              </div>
            ) : row.status === "error" ? (
              <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/20 rounded px-4 py-3.5">
                <XCircle size={18} className="text-[#e50914] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#e50914] text-sm font-bold">Upload failed</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{row.errorMsg}</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-zinc-300 hover:text-white text-xs underline font-medium flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-700 hover:border-[#e50914] bg-zinc-950/40 hover:bg-zinc-950/80 rounded cursor-pointer transition-all duration-200 py-4 group/drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} className="text-zinc-500 group-hover/drop:text-[#e50914] mb-1.5 transition-colors" />
                <p className="text-xs text-zinc-400 group-hover/drop:text-white transition-colors font-medium">
                  Click to select video file
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">MP4 or MKV preferred</p>
              </div>
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
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#e50914] hover:bg-[#e50914]/15 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed mt-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Active upload progress stripe */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 h-[3px] bg-zinc-800 w-full">
          <div
            className="h-full bg-[#e50914] transition-all duration-300"
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
    <div className="mt-6 pt-6 border-t border-zinc-800/80">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <FilePlus2 size={16} className="text-[#e50914]" />
          <span className="text-xs font-black text-white/80 uppercase tracking-widest">
            Add Episodes
          </span>
          <span className="bg-[#e50914] text-white text-[10px] px-2 py-0.5 rounded font-extrabold tracking-wide uppercase">
            {rows.length} {rows.length === 1 ? "Episode" : "Episodes"} Queued
          </span>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 border border-zinc-850 hover:bg-[#e50914] hover:border-transparent px-4 py-2 rounded transition-all duration-150 uppercase tracking-wider"
        >
          <Plus size={13} />
          Add Another
        </button>
      </div>

      {/* Upload hint */}
      <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
        Upload videos for all episodes simultaneously. Once all uploads are complete, click <strong className="text-white">Save All Episodes</strong> to add them to the season.
      </p>

      {/* Episode rows */}
      <div className="space-y-4">
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
      <div className="mt-5 flex flex-wrap gap-3.5 items-center text-xs text-zinc-500 bg-zinc-950/40 p-3.5 rounded border border-zinc-850/60">
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Queue status:</span>
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded border border-zinc-855">
            <span className="text-zinc-500 font-bold">E{i + 1}</span>
            {r.status === "done" && <CheckCircle2 size={13} className="text-[#46d369]" />}
            {(r.status === "authorizing" || r.status === "uploading") && (
              <><Loader2 size={13} className="animate-spin text-[#e50914]" /><span className="text-[#e50914] font-semibold text-[10px]">{r.progress}%</span></>
            )}
            {r.status === "error" && <XCircle size={13} className="text-[#e50914]" />}
            {r.status === "idle" && <span className="text-zinc-700 text-[10px]">—</span>}
          </div>
        ))}
      </div>

      {/* Submit result */}
      {submitResult && (
        <div
          className={`mt-4 flex items-center gap-2.5 px-4 py-3 rounded text-sm font-medium border ${
            submitResult.ok
              ? "bg-[#46d369]/10 border-[#46d369]/30 text-[#46d369]"
              : "bg-red-500/10 border-red-500/30 text-[#e50914]"
          }`}
        >
          {submitResult.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {submitResult.msg}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting || anyUploading}
        className="mt-6 flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-850 disabled:text-zinc-650 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3.5 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 w-full justify-center shadow-lg hover:shadow-[#e50914]/10"
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Saving Episodes...</>
        ) : anyUploading ? (
          <><Loader2 size={16} className="animate-spin text-white" /> Uploading...</>
        ) : !allDone ? (
          <><Upload size={16} /> Upload all videos first</>
        ) : (
          <><Save size={16} /> Save {rows.length} Episode{rows.length !== 1 ? "s" : ""} to Season {seasonNumber}</>
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
  const [activeTab, setActiveTab] = useState<"manual" | "bulk">("manual");

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

  const handleSaveBulk = async (params: {
    isNewSeason: boolean;
    seasonId?: string;
    episodes: { title: string; videoId: string; duration: string }[];
  }) => {
    let targetSeasonId = params.seasonId;
    
    if (params.isNewSeason) {
      const res = await axios.post(`/api/admin/series/${seriesId}/season`);
      targetSeasonId = res.data.id;
    }
    
    if (!targetSeasonId) {
      throw new Error("Target season ID is missing.");
    }
    
    await axios.post(`/api/admin/series/${seriesId}/bulk-episode`, {
      seasonId: targetSeasonId,
      episodes: params.episodes,
    });
    
    mutate();
    setActiveTab("manual");
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
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading series...</p>
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
    <div className="min-h-screen bg-[#141414] text-white px-6 py-10 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-10 border-b border-zinc-800/80 pb-6">
          <button
            onClick={() => router.push("/admin/manage-series")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#181818] border border-zinc-800 hover:border-[#e50914] text-white hover:text-[#e50914] transition-all flex-shrink-0 shadow-md"
          >
            <AiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{data.title}</h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase font-bold tracking-widest">
              {seasons.length} {seasons.length === 1 ? "season" : "seasons"} &middot; {totalEpisodes} episodes
            </p>
          </div>
        </div>

        {/* ── Series Info ── */}
        <div className="bg-[#181818] rounded-md border border-zinc-800/80 p-8 mb-8 space-y-6 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
            <h2 className="text-[#e50914] font-black uppercase text-xs tracking-[0.2em]">Series Information</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Series Title</label>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none h-28 resize-none transition-all duration-200 placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Genre</label>
              <input
                placeholder="Genre"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/60">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Trailer Video</label>
              {data.trailerUrl && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded">
                  <span className="text-[#e50914] font-bold uppercase text-[9px] tracking-wider">Active:</span>
                  <span className="truncate flex-1 font-mono">{data.trailerUrl}</span>
                </div>
              )}
              <VideoUploader onSuccess={(id) => setForm({ ...form, trailerId: id })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Thumbnail Image</label>
              {form.thumbnailUrl && (
                <div className="relative rounded overflow-hidden aspect-video border border-zinc-850 w-full max-h-36 bg-zinc-950 flex items-center justify-center shadow-inner">
                  <img src={form.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                </div>
              )}
              <ImageUploader onSuccess={(url) => setForm({ ...form, thumbnailUrl: url })} />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveInfo}
              disabled={saving}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-800 disabled:opacity-50 px-8 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 shadow-lg hover:shadow-[#e50914]/10"
            >
              <Save size={15} /> {saving ? "Saving info..." : "Save Info"}
            </button>
          </div>
        </div>

        {/* ── Seasons & Episodes ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#e50914] rounded-full" />
                <h2 className="text-xl font-extrabold tracking-tight text-white uppercase text-sm tracking-wider">Seasons & Episodes</h2>
              </div>
              <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-md border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === "manual"
                      ? "bg-[#e50914] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Manage Seasons
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
                onClick={handleAddSeason}
                disabled={addingSeason}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 active:scale-95 transition-all duration-150 disabled:opacity-50 shadow-md"
              >
                <Plus size={15} /> {addingSeason ? "Adding..." : "Add Season"}
              </button>
            )}
          </div>

          {activeTab === "manual" ? (
            seasons.map((season: any) => {
              const isExpanded = expandedSeasons.has(season.id);

              return (
                <div key={season.id} className="bg-[#181818] rounded-md border border-zinc-800/80 overflow-hidden shadow-lg">
                  {/* Season header */}
                  <div
                    className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-zinc-800/20 transition-all duration-150"
                    onClick={() => toggleSeason(season.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-[#e50914]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white tracking-wide">Season {season.number}</h3>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">
                          {season.episodes?.length ?? 0} {season.episodes?.length === 1 ? "episode" : "episodes"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSeason(season.id, season.number);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#e50914] hover:bg-[#e50914]/15 transition-all duration-150"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Season body */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/80 px-6 pb-8 pt-5">
                      {/* Existing episodes */}
                      {season.episodes?.length > 0 ? (
                        <div className="space-y-2.5 mb-6">
                          {season.episodes.map((ep: any) => (
                            <div
                              key={ep.id}
                              className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-850/60 rounded-md px-5 py-4 group hover:bg-zinc-900 transition-colors duration-150"
                            >
                              <span className="text-xl font-black text-zinc-600 w-8 text-center flex-shrink-0">
                                {ep.number}
                              </span>
                              <div className="w-20 aspect-video rounded bg-zinc-950 border border-zinc-855 flex items-center justify-center text-zinc-650 group-hover:border-[#e50914] transition-all duration-150 flex-shrink-0">
                                <Upload size={16} className="text-zinc-600 group-hover:text-[#e50914] transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-white truncate group-hover:text-[#e50914] transition-colors">{ep.title}</p>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">{ep.duration}</p>
                              </div>
                              {ep.videoUrl && (
                                <p className="text-[10px] text-zinc-600 hover:text-zinc-400 truncate max-w-[180px] hidden md:block font-mono bg-black/30 border border-zinc-850 px-2 py-0.5 rounded transition-colors">
                                  {ep.videoUrl}
                                </p>
                              )}
                              <button
                                onClick={() => handleDeleteEpisode(ep.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-650 hover:text-[#e50914] hover:bg-[#e50914]/15 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm mb-6 bg-zinc-900/40 border border-zinc-850/60 px-5 py-4 rounded text-center">No episodes added to this season yet.</p>
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
            })
          ) : (
            currentUser?.email && (
              <BulkUploadTab
                existingSeasons={seasons.map((s: any) => ({ id: s.id, number: s.number }))}
                userEmail={currentUser.email}
                onSave={handleSaveBulk}
              />
            )
          )}

          {seasons.length === 0 && activeTab === "manual" && (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-md text-zinc-500 bg-[#181818]/50 shadow-inner">
              <p className="text-sm font-semibold">No seasons yet.</p>
              <p className="text-xs text-zinc-600 mt-1.5 uppercase font-bold tracking-wider">Click "Add Season" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
