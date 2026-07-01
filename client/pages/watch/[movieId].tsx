"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelectionStore } from "@/zustand/useSelectStore";
import useMovie from "@/hooks/useMovie";
import useMovieList from "@/hooks/useMovieList";
import { MediaPlayer, MediaProvider, MediaPlayerInstance, useMediaStore } from "@vidstack/react";

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

const Movie = () => {
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);
  const { data: allMovies = [] } = useMovieList();
  const { profile } = useSelectionStore();

  const playerRef = useRef<MediaPlayerInstance>(null);
  const hasSeekedRef = useRef(false);
  const nextTriggeredRef = useRef(false);

  const [activeSource, setActiveSource] = useState<"movie" | "trailer" | null>(null);
  const [resumeTime, setResumeTime] = useState(0);
  const [showUpNext, setShowUpNext] = useState(false);

  // Pick a random different movie as suggestion
  const suggestedMovie = useMemo(() => {
    if (!allMovies.length || !movieId) return null;
    const others = allMovies.filter((m: any) => m.id !== movieId);
    return others.length ? others[Math.floor(Math.random() * others.length)] : null;
  }, [allMovies, movieId]);

  // Reset state when source/movie changes
  useEffect(() => {
    hasSeekedRef.current = false;
    nextTriggeredRef.current = false;
    setShowUpNext(false);
  }, [activeSource, movieId]);

  // Fetch saved progress
  useEffect(() => {
    if (!movieId || typeof movieId !== "string") return;
    const profileId = profile?.id;
    const url = profileId ? `/api/watch-progress?profileId=${profileId}&all=true` : `/api/watch-progress?all=true`;
    fetch(url)
      .then((r) => r.json())
      .then((items: any[]) => {
        const saved = items?.find((i) => i.movieId === movieId);
        if (saved?.currentTime > 5 && saved?.percentage < 99.5) setResumeTime(saved.currentTime);
      })
      .catch(() => {});
  }, [movieId, profile?.id]);

  // Save progress
  const saveProgress = useCallback(async () => {
    if (!playerRef.current || !movieId || !data) return;
    const ct = playerRef.current.currentTime;
    const dur = playerRef.current.duration;
    if (ct < 3 || !dur) return;
    try {
      await axios.post("/api/watch-progress", {
        profileId: profile?.id || null,
        contentType: "movie",
        movieId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        currentTime: ct,
        duration: dur,
      });
      setResumeTime(ct);
    } catch {}
  }, [movieId, data, profile?.id]);

  // Periodic auto-save progress
  useEffect(() => {
    if (!activeSource || activeSource !== "movie") return;
    const interval = setInterval(() => {
      saveProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSource, saveProgress]);

  // Save progress on tab close/backgrounding using keepalive fetch
  useEffect(() => {
    const triggerSave = () => {
      if (!playerRef.current || !movieId || !data || activeSource !== "movie") return;
      const ct = playerRef.current.currentTime;
      const dur = playerRef.current.duration;
      if (ct < 3 || !dur) return;

      const body = {
        profileId: profile?.id || null,
        contentType: "movie",
        movieId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        currentTime: ct,
        duration: dur,
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
  }, [activeSource, movieId, data, profile?.id]);

  // Seek to resume time on canplay
  const handleCanPlay = useCallback(() => {
    if (hasSeekedRef.current || activeSource !== "movie") return;
    if (resumeTime > 5 && playerRef.current) {
      playerRef.current.currentTime = resumeTime;
      hasSeekedRef.current = true;
    }
  }, [resumeTime, activeSource]);

  // Show "Up Next" card at last 60 seconds
  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current || nextTriggeredRef.current || activeSource !== "movie") return;
    const { currentTime, duration } = playerRef.current;
    if (!duration || duration < 30) return;
    const remaining = duration - currentTime;
    if (remaining <= 60 && remaining > 0 && suggestedMovie) {
      nextTriggeredRef.current = true;
      setShowUpNext(true);
    }
  }, [suggestedMovie, activeSource]);

  // On natural video end → navigate to next movie
  const handleEnded = useCallback(async () => {
    await saveProgress();
    if (activeSource === "movie" && suggestedMovie) {
      router.push(`/watch/${suggestedMovie.id}`);
    } else {
      setActiveSource(null);
    }
  }, [activeSource, suggestedMovie, router, saveProgress]);

  const exitPlayer = async () => {
    await saveProgress();
    setShowUpNext(false);
    setActiveSource(null);
  };

  const handlePlayNextNow = () => {
    if (!suggestedMovie) return;
    router.push(`/watch/${suggestedMovie.id}`);
  };

  if (!data) {
    return (
      <div className="h-screen w-screen bg-[#141414] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#141414] text-white">
      {/* ── PLAYER ─────────────────────────────────────────────────────────── */}
      {activeSource && (
        <div className="fixed inset-0 z-50 bg-black">
          <MediaPlayer
            ref={playerRef}
            title={data.title}
            src={(router.query.videoUrl as string) || (activeSource === "movie" ? data.videoUrl : data.trailerUrl)}
            autoplay
            className="w-full h-full"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          >
            <MediaProvider />
            <PlyrLayout icons={plyrLayoutIcons} />
            <CenterControlsOverlay playerRef={playerRef} />

            {/* ── Up Next Card (inside player = visible in fullscreen) ── */}
            {showUpNext && suggestedMovie && activeSource === "movie" && (
              <div
                className="absolute bottom-28 right-5 z-[9999] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-[17rem] rounded-xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ background: "rgba(20,20,20,0.97)", backdropFilter: "blur(12px)" }}
                >
                  {/* Thumbnail */}
                  {suggestedMovie.thumbnailUrl && (
                    <div className="relative w-full h-[6.5rem]">
                      <img
                        src={suggestedMovie.thumbnailUrl}
                        alt={suggestedMovie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] shadow-sm" />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">Up Next</span>
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-3.5">
                    <p className="text-white font-bold text-[13px] leading-snug line-clamp-1 mb-3">
                      {suggestedMovie.title}
                    </p>
                    <button
                      onClick={handlePlayNextNow}
                      className="w-full flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#f6121d] text-white py-2 rounded-md font-bold text-[11px] uppercase tracking-wider transition-colors duration-150 cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M8 5v14l11-7z" /></svg>
                      Play Now
                    </button>
                    <button
                      onClick={() => { setShowUpNext(false); nextTriggeredRef.current = true; }}
                      className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider font-bold mt-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Back button overlay ── */}
            <div className="absolute top-0 left-0 right-0 z-[9999] pointer-events-none">
              <button
                onClick={exitPlayer}
                className="pointer-events-auto m-4 flex items-center gap-2.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>{data.title}</span>
              </button>
            </div>
          </MediaPlayer>
        </div>
      )}

      {/* ── HERO INFO (when not playing) ────────────────────────────────── */}
      {!activeSource && (
        <div className="relative min-h-screen flex items-center">
          {/* Cinematic background */}
          <div className="absolute inset-0">
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              className="w-full h-full object-cover"
              style={{ opacity: 0.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />
          </div>

          {/* Top nav */}
          <nav
            className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex items-center"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors group"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:text-[#e50914] transition-colors">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </nav>

          {/* Content */}
          <div className="relative z-10 px-8 md:px-20 pt-24 pb-16 max-w-2xl">
            {/* Genre badge */}
            {data.genre && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 border border-white/15 px-3 py-1 rounded-full mb-6">
                {data.genre}
              </span>
            )}

            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-4 drop-shadow-2xl">
              {data.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
              <span className="text-green-400 font-bold">98% Match</span>
              {data.duration && (
                <span className="text-zinc-400">{data.duration}</span>
              )}
              <span className="border border-zinc-700/80 text-zinc-400 text-[10px] px-2 py-0.5 rounded-sm font-medium">
                4K Ultra HD
              </span>
            </div>

            {/* Resume badge */}
            {resumeTime > 5 && (
              <div className="flex items-center gap-2 mb-5 text-sm text-yellow-400 font-medium">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 5v14l11-7z" /></svg>
                <span>Resume from {Math.floor(resumeTime / 60)}m {Math.floor(resumeTime % 60)}s</span>
              </div>
            )}

            <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-lg line-clamp-4">
              {data.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveSource("movie")}
                className="flex items-center gap-3 bg-white hover:bg-[#e50914] text-black hover:text-white font-bold text-base px-8 py-3.5 rounded-md transition-all duration-150 active:scale-95 shadow-xl cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z" /></svg>
                {resumeTime > 5 ? "Resume" : "Play"}
              </button>

              {data.trailerUrl && (
                <button
                  onClick={() => setActiveSource("trailer")}
                  className="flex items-center gap-3 bg-zinc-600/50 hover:bg-zinc-600/80 text-white font-bold text-base px-8 py-3.5 rounded-md transition-all duration-150 active:scale-95 border border-zinc-600/60 shadow-xl backdrop-blur-sm cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movie;