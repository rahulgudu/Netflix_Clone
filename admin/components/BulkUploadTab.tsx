"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as tus from "tus-js-client";
import { 
  Upload, 
  X, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Info, 
  FileVideo, 
  Save, 
  ArrowRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "authorizing" | "uploading" | "done" | "error";

interface BulkFileState {
  id: string; // local UUID for tracking
  file: File;
  name: string;
  normalizedIdentifier: string | null;
  progress: number;
  status: UploadStatus;
  videoId: string;
  errorMsg?: string;
  uploadInstance?: tus.Upload;
}

interface ParsedLine {
  raw: string;
  identifier: string | null;
  normalizedIdentifier: string | null;
  title: string;
  duration: string;
  episodeNumber: number | null;
}

interface BulkUploadTabProps {
  existingSeasons: { id?: string; number: number }[];
  userEmail: string;
  onSave: (params: {
    isNewSeason: boolean;
    seasonId?: string;
    seasonNumber?: number;
    episodes: { title: string; videoId: string; duration: string }[];
  }) => Promise<void>;
}

// Helper to extract and normalize E<number> identifier (e.g. E01 -> E1)
function getNormalizedIdentifier(str: string): string | null {
  const ob = "[";
  const cb = "]";
  const regex = new RegExp(ob + "eE" + cb + "(\\d+)");
  const match = str.match(regex);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return `E${num}`;
}

// Parses a line of text: E01 Ryomen Sukuna 24m
function parseMetadataLine(line: string): ParsedLine {
  const trimmed = line.trim();
  const ob = "[";
  const cb = "]";
  
  // 1. Extract identifier (e.g. E01, e1, etc.)
  const idRegex = new RegExp(ob + "eE" + cb + "(\\d+)");
  const idMatch = trimmed.match(idRegex);
  const identifier = idMatch ? idMatch[0] : null;
  const episodeNumber = idMatch ? parseInt(idMatch[1], 10) : null;
  const normalizedIdentifier = idMatch ? `E${episodeNumber}` : null;
  
  // 2. Extract duration from end
  const durationRegex = new RegExp("(\\d+\\s*" + ob + "mhMH" + cb + "(?:\\s*\\d+\\s*" + ob + "mhMH" + cb + ")?)$");
  const durationMatch = trimmed.match(durationRegex);
  const duration = durationMatch ? durationMatch[1].trim() : "";
  
  // 3. Extract title (remove identifier and duration)
  let title = trimmed;
  if (identifier) {
    title = title.replace(identifier, "");
  }
  if (duration) {
    const lastIndex = title.lastIndexOf(duration);
    if (lastIndex !== -1) {
      title = title.slice(0, lastIndex) + title.slice(lastIndex + duration.length);
    }
  }
  const startRegex = new RegExp("^\\s*" + ob + "-:_|\\s" + cb + "+");
  const endRegex = new RegExp(ob + "-:_|\\s" + cb + "+\\s*$");
  title = title.replace(startRegex, "").replace(endRegex, "").trim();
  
  return {
    raw: line,
    identifier,
    normalizedIdentifier,
    title: title || "Untitled Episode",
    duration: duration || "24m",
    episodeNumber
  };
}

export default function BulkUploadTab({ existingSeasons, userEmail, onSave }: BulkUploadTabProps) {
  const [seasonSelection, setSeasonSelection] = useState<string>("new");
  const [metadataText, setMetadataText] = useState<string>("");
  const [files, setFiles] = useState<BulkFileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up active uploads on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.uploadInstance) {
          f.uploadInstance.abort();
        }
      });
    };
  }, []);

  const updateFileState = (id: string, patch: Partial<BulkFileState>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  // Upload worker
  const startUpload = async (fileState: BulkFileState) => {
    if (fileState.status === "uploading" || fileState.status === "done") return;

    updateFileState(fileState.id, { 
      status: "authorizing", 
      progress: 0, 
      errorMsg: undefined 
    });

    try {
      const res = await fetch(`/api/admin/create-upload?email=${userEmail}`, {
        method: "POST",
        body: JSON.stringify({ title: fileState.file.name }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to get upload signature");
      
      const { videoId, libraryId, expires, signature } = await res.json();
      
      updateFileState(fileState.id, { status: "uploading", videoId });

      const upload = new tus.Upload(fileState.file, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: expires,
          VideoId: videoId,
          LibraryId: libraryId,
        },
        onProgress: (uploaded, total) => {
          updateFileState(fileState.id, { 
            progress: Math.round((uploaded / total) * 100) 
          });
        },
        onSuccess: () => {
          updateFileState(fileState.id, { status: "done", progress: 100 });
        },
        onError: (err) => {
          console.error("Tus upload failed:", err);
          updateFileState(fileState.id, { 
            status: "error", 
            errorMsg: "Upload failed. Try again." 
          });
        },
      });

      updateFileState(fileState.id, { uploadInstance: upload });
      upload.start();
    } catch (err: any) {
      console.error("Auth error:", err);
      updateFileState(fileState.id, { 
        status: "error", 
        errorMsg: "Authorization failed." 
      });
    }
  };

  const handleFileSelection = (selectedFiles: FileList | File[]) => {
    const newFiles: BulkFileState[] = Array.from(selectedFiles).map((file) => {
      const id = Math.random().toString(36).slice(2);
      const normalizedIdentifier = getNormalizedIdentifier(file.name);
      
      const fileState: BulkFileState = {
        id,
        file,
        name: file.name,
        normalizedIdentifier,
        progress: 0,
        status: "idle",
        videoId: ""
      };
      
      // Auto-start upload
      setTimeout(() => startUpload(fileState), 10);
      return fileState;
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileState = prev.find((f) => f.id === id);
      if (fileState?.uploadInstance) {
        fileState.uploadInstance.abort();
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const retryUpload = (id: string) => {
    const fileState = files.find((f) => f.id === id);
    if (fileState) {
      startUpload(fileState);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  // Live matching calculations
  const matchData = useMemo(() => {
    const lines = metadataText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => parseMetadataLine(line));

    const filesByPattern: Record<string, BulkFileState> = {};
    files.forEach((f) => {
      if (f.normalizedIdentifier) {
        filesByPattern[f.normalizedIdentifier] = f;
      }
    });

    const matched = lines.map((line) => {
      const matchedFile = line.normalizedIdentifier ? filesByPattern[line.normalizedIdentifier] : null;
      return {
        line,
        file: matchedFile,
      };
    });

    const matchedFileIds = new Set(matched.filter((m) => m.file).map((m) => m.file!.id));
    const unmatchedFiles = files.filter((f) => !matchedFileIds.has(f.id));

    return {
      matched,
      unmatchedFiles,
    };
  }, [metadataText, files]);

  // Validation checking
  const allDone = matchData.matched.length > 0 && matchData.matched.every((m) => m.file && m.file.status === "done");
  const anyUploading = files.some((f) => f.status === "authorizing" || f.status === "uploading");
  const hasUnmatchedLines = matchData.matched.some((m) => !m.file);

  const handleSave = async () => {
    if (!allDone || saving) return;
    setSaving(true);
    setSaveResult(null);

    const episodesToSave = matchData.matched.map((m) => ({
      title: m.line.title,
      videoId: m.file!.videoId,
      duration: m.line.duration,
    }));

    try {
      const isNewSeason = seasonSelection === "new";
      let seasonId: string | undefined;
      let seasonNumber: number | undefined;

      if (!isNewSeason) {
        if (seasonSelection.startsWith("existing_id_")) {
          seasonId = seasonSelection.replace("existing_id_", "");
        } else {
          seasonNumber = parseInt(seasonSelection.replace("existing_num_", ""), 10);
        }
      }

      await onSave({
        isNewSeason,
        seasonId,
        seasonNumber,
        episodes: episodesToSave,
      });

      setSaveResult({
        ok: true,
        msg: `Successfully migrated ${episodesToSave.length} episode(s)!`,
      });
      // Clear forms
      setMetadataText("");
      setFiles([]);
    } catch (err: any) {
      console.error(err);
      setSaveResult({
        ok: false,
        msg: err?.response?.data?.message || "Failed to save bulk upload episodes.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Target Season Selection */}
      <div className="bg-[#1c1c1c] border border-zinc-800 rounded-lg p-5">
        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">
          Target Season Selection <span className="text-[#e50914]">*</span>
        </label>
        <select
          value={seasonSelection}
          onChange={(e) => setSeasonSelection(e.target.value)}
          className="w-full md:w-80 bg-[#2b2b2b] hover:bg-[#333] border-b-2 border-transparent focus:border-[#e50914] px-4 py-3 rounded text-sm text-white outline-none cursor-pointer transition-all duration-200"
        >
          <option value="new">Create New Season</option>
          {existingSeasons.map((s) => {
            const val = s.id ? `existing_id_${s.id}` : `existing_num_${s.number}`;
            return (
              <option key={val} value={val}>
                Existing Season {s.number}
              </option>
            );
          })}
        </select>
        <p className="text-[10px] text-zinc-500 mt-2">
          Select whether to ingest these episodes into a new season or choose an existing one.
        </p>
      </div>

      {/* Inputs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Metadata Input */}
        <div className="bg-[#181818] border border-zinc-800 rounded-lg p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <span className="w-1 h-4 bg-[#e50914] rounded-full" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              1. Episode Metadata
            </h3>
          </div>
          
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pasted list of episode definitions. Specify the episode identifier, title, and duration on each line. Separator dashes are cleaned automatically.
          </p>

          <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-md">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Info size={11} className="text-[#e50914]" /> Example Input Format:
            </h4>
            <pre className="text-[10px] font-mono text-zinc-400 bg-black/45 p-2.5 rounded border border-zinc-855 select-all overflow-x-auto leading-relaxed">
{`E01 Ryomen Sukuna 24m
E02 For Myself 23m
E03 Girl of Steel 24m`}
            </pre>
          </div>

          <div>
            <textarea
              placeholder="Paste episode list here...&#10;E01 Episode Title 24m&#10;E02 Another Title 1h 5m"
              value={metadataText}
              onChange={(e) => setMetadataText(e.target.value)}
              className="w-full bg-[#242424] hover:bg-[#2b2b2b] border border-zinc-800 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] p-4 rounded text-sm text-white font-mono outline-none h-64 resize-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Right: Video Files dropzone & List */}
        <div className="bg-[#181818] border border-zinc-800 rounded-lg p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <span className="w-1 h-4 bg-[#e50914] rounded-full" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              2. Video Files
            </h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Select or drag all video files. Their filenames must include matching identifiers (e.g. <code>E01</code>) to link them with the metadata.
          </p>

          {/* Custom Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-250 min-h-36 text-center ${
              isDragging 
                ? "border-[#e50914] bg-[#e50914]/10" 
                : "border-zinc-700 hover:border-[#e50914] bg-zinc-950/40 hover:bg-zinc-950/80"
            }`}
          >
            <Upload size={32} className={`mb-3 transition-colors ${isDragging ? "text-[#e50914] animate-bounce" : "text-zinc-500 hover:text-white"}`} />
            <p className="text-sm font-semibold text-zinc-300">Drag & Drop video files here</p>
            <p className="text-xs text-zinc-500 mt-1">or click to browse local files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
            />
          </div>

          {/* Selected Upload List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Selected Files ({files.length})
              </p>
              {files.map((fileState) => {
                const isUploading = fileState.status === "authorizing" || fileState.status === "uploading";
                return (
                  <div 
                    key={fileState.id}
                    className="flex flex-col bg-zinc-900 border border-zinc-850 px-4 py-3 rounded text-xs gap-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <FileVideo size={16} className={fileState.status === 'done' ? 'text-[#46d369]' : 'text-zinc-500'} />
                      <span className="truncate flex-1 font-mono text-zinc-200 text-[11px]">
                        {fileState.name}
                      </span>
                      {fileState.normalizedIdentifier && (
                        <span className="bg-[#e50914]/15 border border-[#e50914]/30 text-[#e50914] text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                          {fileState.normalizedIdentifier}
                        </span>
                      )}
                      
                      {/* Action buttons */}
                      {fileState.status === "error" && (
                        <button
                          onClick={() => retryUpload(fileState.id)}
                          className="text-zinc-400 hover:text-white flex-shrink-0"
                          title="Retry upload"
                        >
                          <RefreshCw size={13} className="hover:animate-spin" />
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(fileState.id)}
                        disabled={saving}
                        className="text-zinc-500 hover:text-[#e50914] flex-shrink-0 disabled:opacity-30"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-[#e50914] h-full rounded-full transition-all duration-300"
                            style={{ width: `${fileState.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold tracking-tighter w-7 text-right">
                          {fileState.progress}%
                        </span>
                      </div>
                    )}
                    {fileState.status === "done" && (
                      <span className="text-[#46d369] font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={10} /> Upload Complete
                      </span>
                    )}
                    {fileState.status === "error" && (
                      <span className="text-[#e50914] font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <XCircle size={10} /> {fileState.errorMsg || "Upload Failed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reactive Match Preview Card */}
      <div className="bg-[#181818] border border-zinc-800 rounded-lg p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <span className="w-1 h-4 bg-[#e50914] rounded-full" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            3. Reactive Matching Preview
          </h3>
        </div>

        {matchData.matched.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-850 rounded">
            <FolderOpen size={24} className="mx-auto mb-2 text-zinc-650" />
            <p className="text-xs font-semibold">Ready to Match</p>
            <p className="text-[10px] text-zinc-650 mt-1 uppercase">Pasted metadata and dropped video files will align here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-850 rounded-lg bg-zinc-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold bg-[#141414]">
                  <th className="px-5 py-3.5 w-16">ID</th>
                  <th className="px-5 py-3.5">Episode Title</th>
                  <th className="px-5 py-3.5 w-20">Duration</th>
                  <th className="px-5 py-3.5">Matched Video File</th>
                  <th className="px-5 py-3.5 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {matchData.matched.map((m, idx) => {
                  const hasMatch = !!m.file;
                  return (
                    <tr 
                      key={idx} 
                      className="border-b border-zinc-855 hover:bg-zinc-900/35 transition-colors duration-150"
                    >
                      <td className="px-5 py-4 font-black text-zinc-400">
                        {m.line.normalizedIdentifier || `Line ${idx + 1}`}
                      </td>
                      <td className="px-5 py-4 font-bold text-zinc-200">
                        {m.line.title}
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {m.line.duration}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px]">
                        {hasMatch ? (
                          <span className="text-zinc-300">{m.file!.name}</span>
                        ) : (
                          <span className="text-[#e50914] font-semibold tracking-wide">
                            ⚠️ Missing video file (unmatched)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasMatch ? (
                          m.file!.status === "done" ? (
                            <span className="text-[#46d369] font-extrabold flex items-center gap-1 uppercase text-[10px]">
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          ) : m.file!.status === "error" ? (
                            <span className="text-[#e50914] font-extrabold flex items-center gap-1 uppercase text-[10px]">
                              <XCircle size={12} /> Failed
                            </span>
                          ) : (
                            <span className="text-[#e50914] font-extrabold flex items-center gap-1.5 uppercase text-[10px] animate-pulse">
                              <Loader2 size={12} className="animate-spin text-[#e50914]" /> Uploading
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-600 font-extrabold uppercase text-[10px]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Unmatched Files Alert */}
        {matchData.unmatchedFiles.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md text-xs space-y-2">
            <h4 className="font-extrabold uppercase tracking-wider flex items-center gap-2">
              ⚠️ The following selected files do not match any episode line in your text input:
            </h4>
            <ul className="list-disc pl-5 font-mono text-[11px] space-y-1.5 text-zinc-300">
              {matchData.unmatchedFiles.map((uf) => (
                <li key={uf.id}>
                  {uf.name} (extracted identifier:{" "}
                  <strong className="text-yellow-500">
                    {uf.normalizedIdentifier || "none"}
                  </strong>
                  )
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-zinc-400">
              To map them, make sure each line in the text area includes the corresponding identifier (e.g. <code>E01</code>) present in the video file's name.
            </p>
          </div>
        )}
      </div>

      {/* Save Button & Submit Result */}
      {saveResult && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3.5 rounded text-sm font-semibold border ${
            saveResult.ok
              ? "bg-[#46d369]/10 border-[#46d369]/30 text-[#46d369]"
              : "bg-red-500/10 border-red-500/30 text-[#e50914]"
          }`}
        >
          {saveResult.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {saveResult.msg}
        </div>
      )}

      {hasUnmatchedLines && (
        <div className="bg-red-500/10 border border-red-500/20 text-[#e50914] p-4 rounded-md text-xs font-bold leading-normal">
          Some parsed episode lines are missing matching video files. Make sure to upload the matching videos before saving.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!allDone || saving || anyUploading}
        className="w-full bg-[#e50914] hover:bg-[#b81d24] disabled:bg-zinc-855 disabled:text-zinc-650 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded font-bold text-sm uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-[#e50914]/10"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving Bulk Upload...
          </>
        ) : anyUploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Uploading Video Files...
          </>
        ) : !allDone ? (
          <>
            <Upload size={16} /> Enter metadata & upload files to match
          </>
        ) : (
          <>
            <Save size={16} /> Save Mapped Episodes to {seasonSelection === "new" ? "New Season" : `Season ${seasonSelection.includes("existing_id_") ? existingSeasons.find(s => `existing_id_${s.id}` === seasonSelection)?.number : seasonSelection.replace("existing_num_", "")}`}
          </>
        )}
      </button>
    </div>
  );
}
