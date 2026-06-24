"use client";

import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";
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

export default function SeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data } = useSeries(seriesId as string);
  const { profile } = useSelectionStore();

  const [activeSeason, setActiveSeason] = useState(0);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);

  // Map of episodeId → saved currentTime fetched from API
  const [savedTimes, setSavedTimes] = useState<Record<string, number>>({});

  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeekedRef = useRef(false);

  // ── Fetch saved progress for this series ─────────────────────────────────
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
          if (item.seriesId === seriesId && item.episodeId && item.currentTime > 5) {
            map[item.episodeId] = item.currentTime;
          }
        });
        setSavedTimes(map);
      })
      .catch(() => {});
  }, [seriesId, profile?.id]);

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
      // Update local savedTimes so the UI reflects new state
      setSavedTimes((prev) => ({ ...prev, [playing.episodeId]: currentTime }));
    } catch {}
  }, [playing, data, profile?.id, seriesId]);

  // Start/stop reporting interval
  useEffect(() => {
    if (playing) {
      hasSeekedRef.current = false;
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

  // ── Seek to saved position once ready ────────────────────────────────────
  const handleCanPlay = useCallback(() => {
    if (hasSeekedRef.current || !playing) return;
    const savedTime = playing.savedTime ?? 0;
    if (savedTime > 5 && playerRef.current) {
      playerRef.current.currentTime = savedTime;
      hasSeekedRef.current = true;
    }
  }, [playing]);

  const playEpisode = (videoUrl: string, title: string, episodeId: string, seasonId: string, episodeLabel: string) => {
    setPlaying({ videoUrl, title, episodeId, seasonId, episodeLabel, savedTime: savedTimes[episodeId] });
  };

  const exitPlayer = async () => {
    await saveProgress();
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }
    setPlaying(null);
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

      {/* Video Player overlay */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <MediaPlayer
            ref={playerRef}
            autoplay
            title={playing.title}
            src={playing.videoUrl}
            className="h-full w-full"
            onCanPlay={handleCanPlay}
          >
            <MediaProvider />
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>
        </div>
      )}

      {/* Series content */}
      {!playing && (
        <>
          {/* Hero */}
          <div className="relative h-[60vh] w-full flex items-end px-4 md:px-16 overflow-hidden">
            <div className="absolute inset-0 z-0">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="w-full h-full object-cover opacity-40"
                />
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
                      activeSeason === idx
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
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
                      onClick={() =>
                        playEpisode(episode.videoUrl, episodeTitle, episode.id, currentSeason.id, episodeLabel)
                      }
                      className="relative flex items-center gap-4 bg-zinc-800/60 hover:bg-zinc-700/80 rounded-lg p-4 cursor-pointer transition group overflow-hidden"
                    >
                      {/* Progress bar at bottom */}
                      {hasSaved && episode.duration && (
                        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-600">
                          <div
                            className="h-full bg-red-600 transition-all"
                            style={{
                              width: `${Math.min(100, (savedTime / (parseDuration(episode.duration) || 1)) * 100)}%`,
                            }}
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

/** Convert "45m" / "1h 20m" / "3h 49m" → seconds for progress bar width */
function parseDuration(d?: string): number {
  if (!d) return 0;
  const hours = d.match(/(\d+)h/)?.[1];
  const mins = d.match(/(\d+)m/)?.[1];
  return (parseInt(hours || "0") * 60 + parseInt(mins || "0")) * 60;
}
