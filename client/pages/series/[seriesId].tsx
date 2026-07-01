"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelectionStore } from "@/zustand/useSelectStore";
import useSeries from "@/hooks/useSeries";
import {
  MediaPlayer,
  MediaProvider,
  MediaPlayerInstance,
  useMediaStore,
} from "@vidstack/react";

// Modern custom SVGs for 30s Rewind/Forward
const Rewind30Icon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4a8 8 0 1 0 8 8" />
    <polyline points="12 1 9 4 12 7" />
    <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="900" fill="currentColor" stroke="none" fontFamily="sans-serif">
      30
    </text>
  </svg>
);

const Forward30Icon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4a8 8 0 1 1-8 8" />
    <polyline points="12 1 15 4 12 7" />
    <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="900" fill="currentColor" stroke="none" fontFamily="sans-serif">
      30
    </text>
  </svg>
);

// Custom icon overrides removed as we are now using Plyr layout.

// Center Overlay for Rewind 30s, Play/Pause, Forward 30s
const CenterControlsOverlay = ({ playerRef }: { playerRef: React.RefObject<MediaPlayerInstance | null> }) => {
  const { paused, controlsVisible } = useMediaStore();

  const handleRewind = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.currentTime = Math.max(0, playerRef.current.currentTime - 30);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.currentTime = Math.min(
        playerRef.current.duration || 0,
        playerRef.current.currentTime + 30
      );
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current) {
      if (paused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center gap-10 md:gap-16 z-40 transition-all duration-300 pointer-events-none ${
        controlsVisible ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
      }`}
    >
      {/* Rewind Button */}
      <button
        onClick={handleRewind}
        className="pointer-events-auto p-4 rounded-full bg-black/55 hover:bg-black/80 border border-white/10 hover:scale-110 active:scale-95 transition-all text-white hover:text-[#e50914] shadow-lg focus:outline-none"
        title="Rewind 30s"
      >
        <Rewind30Icon className="w-8 h-8 md:w-10 h-10" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="pointer-events-auto p-5 md:p-6 rounded-full bg-black/65 hover:bg-[#e50914]/95 border border-white/20 hover:border-transparent hover:scale-110 active:scale-95 transition-all text-white shadow-xl focus:outline-none flex items-center justify-center"
        title={paused ? "Play" : "Pause"}
      >
        {paused ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 h-10 translate-x-[2px]">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 h-10">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>

      {/* Forward Button */}
      <button
        onClick={handleForward}
        className="pointer-events-auto p-4 rounded-full bg-black/55 hover:bg-black/80 border border-white/10 hover:scale-110 active:scale-95 transition-all text-white hover:text-[#e50914] shadow-lg focus:outline-none"
        title="Forward 30s"
      >
        <Forward30Icon className="w-8 h-8 md:w-10 h-10" />
      </button>
    </div>
  );
};
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";
import { FaPlay } from "react-icons/fa";

interface PlayTarget {
  videoUrl: string;
  title: string;
  episodeId: string;
  seasonId: string;
  episodeLabel: string;
  savedTime?: number;
  savedPercentage?: number;
}

export default function SeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data } = useSeries(seriesId as string);
  const { profile } = useSelectionStore();

  const playerRef = useRef<MediaPlayerInstance>(null);
  const hasSeekedRef = useRef(false);
  const nextEpTriggeredRef = useRef(false);

  const [activeSeason, setActiveSeason] = useState(0);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const [savedTimes, setSavedTimes] = useState<Record<string, { currentTime: number; percentage: number }>>({});

  // ── Next episode state ─────────────────────────────────────────────────────
  const [nextEpData, setNextEpData] = useState<PlayTarget | null>(null);
  const [showNextEp, setShowNextEp] = useState(false);

  // ── Reset a watched episode's progress to 0 ───────────────────────────────
  const resetEpisodeProgress = useCallback(async (episodeId: string) => {
    if (!episodeId) return;
    try {
      await axios.post("/api/watch-progress", {
        profileId: profile?.id || null,
        contentType: "episode",
        episodeId,
        seriesId,
        title: data?.title || "",
        thumbnailUrl: data?.thumbnailUrl || "",
        episodeLabel: "",
        currentTime: 0,
        duration: 1,
      });
      setSavedTimes((prev) => {
        const next = { ...prev };
        delete next[episodeId];
        return next;
      });
    } catch {}
  }, [profile?.id, seriesId, data?.title, data?.thumbnailUrl]);

  // ── Fetch saved progress ──────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesId) return;
    const profileId = profile?.id;
    const url = profileId
      ? `/api/watch-progress?profileId=${profileId}&all=true`
      : `/api/watch-progress?all=true`;
    fetch(url)
      .then((r) => r.json())
      .then((items: any[]) => {
        if (!Array.isArray(items)) return;
        const map: Record<string, { currentTime: number; percentage: number }> = {};
        items.forEach((item) => {
          if (item.seriesId === seriesId && item.episodeId && item.currentTime > 5)
            map[item.episodeId] = { currentTime: item.currentTime, percentage: item.percentage || 0 };
        });
        setSavedTimes(map);
      })
      .catch(() => {});
  }, [seriesId, profile?.id]);

  // ── Find next episode in season/series ───────────────────────────────────
  const findNextEpisode = useCallback((): PlayTarget | null => {
    if (!playing || !data) return null;
    const seasons = data.seasons ?? [];
    const seasonIdx = seasons.findIndex((s: any) => s.id === playing.seasonId);
    if (seasonIdx === -1) return null;
    const season = seasons[seasonIdx];
    const epIdx = season.episodes.findIndex((e: any) => e.id === playing.episodeId);

    // Next ep in same season
    if (epIdx + 1 < season.episodes.length) {
      const ep = season.episodes[epIdx + 1];
      const label = `S${season.number}:E${ep.number} — ${ep.title}`;
      return {
        videoUrl: ep.videoUrl,
        title: `${data.title} — ${label}`,
        episodeId: ep.id,
        seasonId: season.id,
        episodeLabel: label,
        savedTime: savedTimes[ep.id]?.currentTime || 0,
        savedPercentage: savedTimes[ep.id]?.percentage || 0,
      };
    }

    // First ep of next season
    if (seasonIdx + 1 < seasons.length) {
      const nextSeason = seasons[seasonIdx + 1];
      if (nextSeason.episodes.length > 0) {
        const ep = nextSeason.episodes[0];
        const label = `S${nextSeason.number}:E${ep.number} — ${ep.title}`;
        return {
          videoUrl: ep.videoUrl,
          title: `${data.title} — ${label}`,
          episodeId: ep.id,
          seasonId: nextSeason.id,
          episodeLabel: label,
          savedTime: savedTimes[ep.id]?.currentTime || 0,
          savedPercentage: savedTimes[ep.id]?.percentage || 0,
        };
      }
    }

    return null;
  }, [playing, data, savedTimes]);

  // Compute next episode whenever playing changes
  useEffect(() => {
    if (playing) {
      const next = findNextEpisode();
      setNextEpData(next);
      nextEpTriggeredRef.current = false;
      setShowNextEp(false);
      hasSeekedRef.current = false;
    }
  }, [playing, findNextEpisode]);

  // Save progress callback
  const saveProgress = useCallback(async () => {
    if (!playerRef.current || !playing || !data) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (currentTime < 3 || !duration) return;
    try {
      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      await axios.post("/api/watch-progress", {
        profileId: profile?.id || null,
        contentType: "episode",
        episodeId: playing.episodeId,
        seriesId,
        seasonId: playing.seasonId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        episodeLabel: playing.episodeLabel,
        currentTime,
        duration,
      });
      setSavedTimes((prev) => ({ ...prev, [playing.episodeId]: { currentTime, percentage } }));
    } catch {}
  }, [playing, data, profile?.id, seriesId]);

  // Periodic auto-save progress
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      saveProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [playing, saveProgress]);

  // Save progress on tab close/backgrounding using keepalive fetch
  useEffect(() => {
    const triggerSave = () => {
      if (!playerRef.current || !playing || !data) return;
      const currentTime = playerRef.current.currentTime;
      const duration = playerRef.current.duration;
      if (currentTime < 3 || !duration) return;

      const body = {
        profileId: profile?.id || null,
        contentType: "episode",
        episodeId: playing.episodeId,
        seriesId,
        seasonId: playing.seasonId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        episodeLabel: playing.episodeLabel,
        currentTime,
        duration,
      };

      fetch("/api/watch-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerSave();
      }
    };

    const handlePageHide = () => {
      triggerSave();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [playing, data, profile?.id, seriesId]);

  // Seek to saved position on canplay
  const handleCanPlay = useCallback(() => {
    if (hasSeekedRef.current) return;
    if (playing?.savedTime && playing.savedTime > 5 && playerRef.current) {
      if ((playing.savedPercentage || 0) < 99.5) {
        playerRef.current.currentTime = playing.savedTime;
      }
      hasSeekedRef.current = true;
    }
  }, [playing?.savedTime, playing?.savedPercentage]);

  // Time update — show "Next Episode" card at last 1 min
  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current || nextEpTriggeredRef.current) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (!duration || duration < 30) return;

    const remaining = duration - currentTime;
    if (remaining <= 60 && remaining > 0 && nextEpData) {
      nextEpTriggeredRef.current = true;
      setShowNextEp(true);
    }
  }, [nextEpData]);

  const exitPlayer = async () => {
    await saveProgress();
    setShowNextEp(false);
    setPlaying(null);
  };

  const handlePlayNextNow = () => {
    if (!nextEpData) return;
    if (playing?.episodeId) {
      resetEpisodeProgress(playing.episodeId);
    }
    setShowNextEp(false);
    setPlaying(nextEpData);
  };

  const handleCancelNextEp = () => {
    setShowNextEp(false);
    nextEpTriggeredRef.current = true;
  };

  // On natural end, go to next episode
  const handleEnded = useCallback(() => {
    if (nextEpData) {
      if (playing?.episodeId) resetEpisodeProgress(playing.episodeId);
      setPlaying(nextEpData);
    } else {
      exitPlayer();
    }
  }, [nextEpData, playing?.episodeId]);

  const playEpisode = (
    videoUrl: string, title: string, episodeId: string,
    seasonId: string, episodeLabel: string
  ) => {
    setPlaying({
      videoUrl,
      title,
      episodeId,
      seasonId,
      episodeLabel,
      savedTime: savedTimes[episodeId]?.currentTime || 0,
      savedPercentage: savedTimes[episodeId]?.percentage || 0,
    });
  };

  if (!data) {
    return (
      <div className="h-screen w-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="animate-pulse text-zinc-500 font-medium">Loading...</div>
      </div>
    );
  }

  const seasons = data.seasons ?? [];
  const currentSeason = seasons[activeSeason];

  return (
    <div className="min-h-screen w-full bg-[#141414] text-white font-sans">
      {/* Video Player */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-black w-screen h-screen">
          <MediaPlayer
            ref={playerRef}
            autoplay
            title={playing.title}
            src={(router.query.videoUrl as string) || playing.videoUrl}
            className="h-full w-full font-sans"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          >
            <MediaProvider />
            <PlyrLayout icons={plyrLayoutIcons} />
            <CenterControlsOverlay playerRef={playerRef} />

            {/* Next Episode Overlay — inside MediaPlayer for fullscreen visibility */}
            {showNextEp && nextEpData && (
              <div
                className="absolute bottom-24 right-6 z-[200] animate-in slide-in-from-bottom-4 duration-300"
                style={{ pointerEvents: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/60 rounded-xl overflow-hidden w-72 shadow-2xl">
                  {/* Thumbnail strip */}
                  {data.thumbnailUrl && (
                    <div className="relative w-full h-28">
                      <img
                        src={data.thumbnailUrl}
                        alt={nextEpData.episodeLabel}
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-300 bg-black/60 px-2 py-0.5 rounded">
                        <span className="w-2 h-2 rounded-full bg-[#e50914]" />
                        Next Episode
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-white font-bold text-sm leading-snug truncate">
                      {data.title}
                    </p>
                    <p className="text-zinc-500 text-[11px] font-semibold truncate mt-0.5">
                      {nextEpData.episodeLabel}
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayNextNow();
                        }}
                        className="flex items-center gap-2 bg-white text-black hover:bg-[#e50914] hover:text-white px-4 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer"
                      >
                        <FaPlay size={10} /> Play Now
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelNextEp();
                      }}
                      className="mt-3 w-full text-center text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 hover:text-zinc-300 transition duration-150 py-1 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </MediaPlayer>

          {/* Back button overlaid at top-left */}
          <button
            onClick={exitPlayer}
            className="absolute top-5 left-5 z-[300] flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium"
            style={{ pointerEvents: "auto" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}

      {/* Series info + episode list */}
      {!playing && (
        <>
          {/* Hero */}
          <div className="relative h-[60vh] w-full flex items-end px-4 md:px-16 overflow-hidden">
            <div className="absolute inset-0 z-0">
              {data.thumbnailUrl ? (
                <img src={data.thumbnailUrl} alt={data.title} className="w-full h-full object-cover opacity-40" />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
            </div>

            {/* Back button */}
            <nav className="fixed top-0 left-0 w-full z-50 flex items-center gap-4 px-8 py-5" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
              <button onClick={() => router.back()} className="flex items-center gap-3 group text-white">
                <span className="w-5 h-5 group-hover:text-[#e50914] transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </span>
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">Back</span>
              </button>
            </nav>

            <div className="relative z-10 max-w-2xl mb-10 mt-20">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-3 drop-shadow-xl">{data.title}</h1>
              <div className="flex items-center gap-4 mb-4 text-sm font-semibold">
                {data.releaseYear && <span className="text-gray-400">{data.releaseYear}</span>}
                <span className="text-gray-400">
                  {seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}
                </span>
                {data.rating && (
                  <span className="border border-gray-500 px-2 py-0.5 text-[10px] rounded-sm">{data.rating}</span>
                )}
              </div>
              <p className="text-gray-200 text-base md:text-lg leading-snug mb-6 drop-shadow-md line-clamp-3">
                {data.description}
              </p>
              {data.genre && (
                <p className="text-gray-400 text-sm">
                  <span className="text-gray-500">Genre:</span> {data.genre}
                </p>
              )}
            </div>
          </div>

          {/* Season Tabs + Episodes */}
          <div className="px-4 md:px-16 pb-24">
            {seasons.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                {seasons.map((season: any, idx: number) => (
                  <button
                    key={season.id}
                    onClick={() => setActiveSeason(idx)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition ${
                      activeSeason === idx ? "bg-[#e50914] text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                  >
                    Season {season.number}
                  </button>
                ))}
              </div>
            )}

            {currentSeason ? (
              <div className="space-y-3">
                {currentSeason.episodes.map((episode: any) => {
                  const episodeTitle = `${data.title} — S${currentSeason.number}:E${episode.number} ${episode.title}`;
                  const episodeLabel = `S${currentSeason.number}:E${episode.number} — ${episode.title}`;
                  const progress = savedTimes[episode.id];
                  const hasSaved = progress && progress.currentTime > 5;

                  return (
                    <div
                      key={episode.id}
                      onClick={() => playEpisode(episode.videoUrl, episodeTitle, episode.id, currentSeason.id, episodeLabel)}
                      className="relative flex items-center gap-4 bg-zinc-800/60 hover:bg-zinc-700/80 rounded-lg p-4 cursor-pointer transition group overflow-hidden"
                    >
                      {hasSaved && (
                        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-600">
                          <div
                            className="h-full bg-[#e50914] transition-all"
                            style={{ width: `${Math.min(100, progress.percentage)}%` }}
                          />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-zinc-700 group-hover:bg-[#e50914] flex items-center justify-center flex-shrink-0 transition">
                        <FaPlay size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-400">Episode {episode.number}</p>
                        <p className="font-semibold truncate">{episode.title}</p>
                        {hasSaved && progress.percentage < 99.5 && (
                          <p className="text-xs text-yellow-400 mt-0.5">
                            Resume from {Math.floor(progress.currentTime / 60)}m {Math.floor(progress.currentTime % 60)}s
                          </p>
                        )}
                      </div>
                      {episode.duration && (
                        <span className="text-gray-500 text-sm flex-shrink-0">{episode.duration}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No episodes available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// parseDuration function removed as watch progress percentage is fetched directly from database records.
