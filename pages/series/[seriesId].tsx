"use client";

import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import axios from "axios";

import useSeries from "@/hooks/useSeries";
import { useSelectionStore } from "@/zustand/states/useSelectStore";

interface PlayTarget {
  videoUrl: string;
  title: string;
  episodeId: string;
  seasonId: string;
  episodeLabel: string;
  savedTime?: number;
}

// Countdown ring removed (auto-autoplay countdown timer replaced by ended trigger)

export default function SeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data } = useSeries(seriesId as string);
  const { profile } = useSelectionStore();

  const [activeSeason, setActiveSeason] = useState(0);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const [savedTimes, setSavedTimes] = useState<Record<string, number>>({});

  // ── Next episode autoplay state ───────────────────────────────────────────
  const [nextEpData, setNextEpData] = useState<PlayTarget | null>(null);
  const [showNextEp, setShowNextEp] = useState(false);
  const nextEpTriggeredRef = useRef(false); // prevent re-triggering in same episode

  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeekedRef = useRef(false);

  // ── Reset a watched episode's progress to 0 ───────────────────────────────
  // Called when user moves to the next episode so the previous one shows 0%
  const resetEpisodeProgress = useCallback(async (episodeId: string) => {
    if (!episodeId) return;
    try {
      // Post with currentTime=0 and duration=1 triggers percentage=0 upsert,
      // effectively resetting the record so it disappears from Continue Watching
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
      // Also clear from local state
      setSavedTimes((prev) => {
        const next = { ...prev };
        delete next[episodeId];
        return next;
      });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, seriesId, data?.title, data?.thumbnailUrl]);

  // ── Fetch saved progress ──────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesId) return;
    const profileId = profile?.id;
    const url = profileId
      ? `/api/watch-progress?profileId=${profileId}`
      : `/api/watch-progress`;
    fetch(url)
      .then((r) => r.json())
      .then((items: any[]) => {
        if (!Array.isArray(items)) return;
        const map: Record<string, number> = {};
        items.forEach((item) => {
          if (item.seriesId === seriesId && item.episodeId && item.currentTime > 5)
            map[item.episodeId] = item.currentTime;
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
        savedTime: savedTimes[ep.id],
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
          savedTime: savedTimes[ep.id],
        };
      }
    }

    return null; // No next episode (last episode of series)
  }, [playing, data, savedTimes]);

  // ── Time update handler — triggers next-ep overlay at last 1 minute ──────
  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current || nextEpTriggeredRef.current) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (!duration || duration < 30) return;

    const remaining = duration - currentTime;
    if (remaining <= 60 && remaining > 0) {
      const next = findNextEpisode();
      if (next) {
        nextEpTriggeredRef.current = true;
        setNextEpData(next);
        setShowNextEp(true);
      }
    }
  }, [findNextEpisode]);

  // ── Progress reporter ─────────────────────────────────────────────────────
  const saveProgress = useCallback(async () => {
    if (!playerRef.current || !playing || !data) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (!currentTime || !duration || currentTime < 3) return;
    try {
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
      setSavedTimes((prev) => ({ ...prev, [playing.episodeId]: currentTime }));
    } catch {}
  }, [playing, data, profile?.id, seriesId]);

  useEffect(() => {
    if (playing) {
      hasSeekedRef.current = false;
      nextEpTriggeredRef.current = false;
      setShowNextEp(false);
      progressIntervalRef.current = setInterval(saveProgress, 5000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // ── Seek to saved position ────────────────────────────────────────────────
  const handleCanPlay = useCallback(() => {
    if (hasSeekedRef.current || !playing) return;
    const savedTime = playing.savedTime ?? 0;
    if (savedTime > 5 && playerRef.current) {
      playerRef.current.currentTime = savedTime;
      hasSeekedRef.current = true;
    }
  }, [playing]);

  const playEpisode = (
    videoUrl: string, title: string, episodeId: string,
    seasonId: string, episodeLabel: string
  ) => {
    setPlaying({ videoUrl, title, episodeId, seasonId, episodeLabel, savedTime: savedTimes[episodeId] });
  };

  const exitPlayer = async () => {
    await saveProgress();
    setShowNextEp(false);
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }
    setPlaying(null);
  };

  const handlePlayNextNow = () => {
    if (!nextEpData) return;
    // Reset current episode progress to 0 before playing next
    if (playing?.episodeId) {
      resetEpisodeProgress(playing.episodeId);
    }
    setShowNextEp(false);
    setPlaying(nextEpData);
  };

  const handleCancelNextEp = () => {
    setShowNextEp(false);
    nextEpTriggeredRef.current = true; // don't re-trigger
  };

  if (!data) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  const seasons = data.seasons ?? [];
  const currentSeason = seasons[activeSeason];

  return (
    <div className="min-h-screen w-full bg-[#141414] text-white font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 w-full z-[100] flex items-center gap-4 px-6 py-6 bg-gradient-to-b from-black/90 to-transparent">
        <AiOutlineArrowLeft
          onClick={() => (playing ? exitPlayer() : router.back())}
          className="cursor-pointer hover:scale-110 transition-transform"
          size={30}
        />
        <span className="text-lg font-medium tracking-wide">
          {playing ? `Watching: ${playing.title}` : data.title}
        </span>
      </nav>

      {/* Video Player */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <MediaPlayer
            ref={playerRef}
            autoplay
            title={playing.title}
            src={playing.videoUrl}
            className="h-full w-full font-sans"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handlePlayNextNow}
          >
            <MediaProvider />
            <DefaultVideoLayout
              icons={defaultLayoutIcons}
              colorScheme="dark"
              smallLayoutWhen={({ width }) => width < 576}
            />

            {/* ── Next Episode Overlay (Netflix-style, bottom-right) inside player to support fullscreen ── */}
            {showNextEp && nextEpData && (
              <div 
                className="absolute bottom-24 right-6 z-[200] flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 duration-300"
                style={{ pointerEvents: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Card */}
                <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl overflow-hidden w-72 shadow-2xl">
                  {/* Thumbnail strip */}
                  {data.thumbnailUrl && (
                    <div className="relative w-full h-28">
                      <img
                        src={data.thumbnailUrl}
                        alt={nextEpData.episodeLabel}
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                        Next Episode
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-4">
                      {nextEpData.episodeLabel}
                    </p>

                    {/* Buttons row */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayNextNow();
                        }}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-md font-bold text-sm hover:bg-white/90 transition flex-1 justify-center cursor-pointer pointer-events-auto"
                      >
                        <FaPlay size={12} />
                        Play Now
                      </button>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelNextEp();
                      }}
                      className="mt-2.5 w-full text-center text-xs text-gray-500 hover:text-gray-300 transition py-1 cursor-pointer pointer-events-auto"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </MediaPlayer>
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
                      activeSeason === idx ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
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
                  const savedTime = savedTimes[episode.id];
                  const hasSaved = savedTime && savedTime > 5;

                  return (
                    <div
                      key={episode.id}
                      onClick={() => playEpisode(episode.videoUrl, episodeTitle, episode.id, currentSeason.id, episodeLabel)}
                      className="relative flex items-center gap-4 bg-zinc-800/60 hover:bg-zinc-700/80 rounded-lg p-4 cursor-pointer transition group overflow-hidden"
                    >
                      {hasSaved && episode.duration && (
                        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-600">
                          <div
                            className="h-full bg-red-600 transition-all"
                            style={{ width: `${Math.min(100, (savedTime / (parseDuration(episode.duration) || 1)) * 100)}%` }}
                          />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-zinc-700 group-hover:bg-red-600 flex items-center justify-center flex-shrink-0 transition">
                        <FaPlay size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-400">Episode {episode.number}</p>
                        <p className="font-semibold truncate">{episode.title}</p>
                        {hasSaved && (
                          <p className="text-xs text-yellow-400 mt-0.5">
                            Resume from {Math.floor(savedTime / 60)}m {Math.floor(savedTime % 60)}s
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

function parseDuration(d?: string): number {
  if (!d) return 0;
  const hours = d.match(/(\d+)h/)?.[1];
  const mins = d.match(/(\d+)m/)?.[1];
  return (parseInt(hours || "0") * 60 + parseInt(mins || "0")) * 60;
}
