"use client";

import useMovie from "@/hooks/useMovie";
import useMovieList from "@/hooks/useMovieList";
import { useRouter } from "next/router";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaPlay, FaFilm, FaHome } from "react-icons/fa";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import axios from "axios";

// ── SVG countdown ring ─────────────────────────────────────────────────────
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CountdownRing({ seconds, total = 5 }: { seconds: number; total?: number }) {
  const progress = seconds / total;
  const dash = CIRCUMFERENCE * progress;
  return (
    <svg width="56" height="56" className="rotate-[-90deg]">
      <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="#3f3f46" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={RADIUS} fill="none"
        stroke="#e50914" strokeWidth="4"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        style={{ transition: "stroke-dasharray 1s linear" }}
      />
      <text
        x="28" y="28" textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="14" fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "28px 28px" }}
      >
        {seconds}
      </text>
    </svg>
  );
}

const Movie = () => {
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);
  const { data: allMovies = [] } = useMovieList();
  const { profile } = useSelectionStore();

  const [activeSource, setActiveSource] = useState<"movie" | "trailer" | null>(null);
  const [resumeTime, setResumeTime] = useState<number>(0);

  // ── Next movie autoplay state ─────────────────────────────────────────────
  const [showNextMovie, setShowNextMovie] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextMovieTriggeredRef = useRef(false);

  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeekedRef = useRef(false);

  // Pick a random different movie as suggestion
  const suggestedMovie = useMemo(() => {
    if (!allMovies.length || !movieId) return null;
    const others = allMovies.filter((m: any) => m.id !== movieId);
    if (!others.length) return null;
    return others[Math.floor(Math.random() * others.length)];
  }, [allMovies, movieId]);

  // ── Fetch saved progress ──────────────────────────────────────────────────
  useEffect(() => {
    if (!movieId || typeof movieId !== "string") return;
    const profileId = profile?.id;
    const url = profileId
      ? `/api/watch-progress?profileId=${profileId}`
      : `/api/watch-progress`;

    fetch(url)
      .then((r) => r.json())
      .then((items: any[]) => {
        const saved = items?.find((i) => i.movieId === movieId);
        if (saved && saved.currentTime > 5) setResumeTime(saved.currentTime);
      })
      .catch(() => {});
  }, [movieId, profile?.id]);

  // ── Progress saver ────────────────────────────────────────────────────────
  const saveProgress = useCallback(async () => {
    if (!playerRef.current || !movieId || !data) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (!currentTime || !duration || currentTime < 3) return;
    try {
      await axios.post("/api/watch-progress", {
        profileId: profile?.id || null,
        contentType: "movie",
        movieId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        currentTime,
        duration,
      });
    } catch {}
  }, [movieId, data, profile?.id]);

  useEffect(() => {
    if (activeSource === "movie") {
      hasSeekedRef.current = false;
      nextMovieTriggeredRef.current = false;
      setShowNextMovie(false);
      progressIntervalRef.current = setInterval(saveProgress, 5000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (activeSource === null && movieId) saveProgress();
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSource]);

  // ── Seek to saved position ────────────────────────────────────────────────
  const handleCanPlay = useCallback(() => {
    if (hasSeekedRef.current) return;
    if (resumeTime > 5 && playerRef.current) {
      playerRef.current.currentTime = resumeTime;
      hasSeekedRef.current = true;
    }
  }, [resumeTime]);

  // ── Time update: trigger "next movie" overlay at last 2 minutes ───────────
  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current || nextMovieTriggeredRef.current) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (!duration || duration < 30) return;

    const remaining = duration - currentTime;
    if (remaining <= 120 && remaining > 0 && suggestedMovie) {
      nextMovieTriggeredRef.current = true;
      setCountdown(5);
      setShowNextMovie(true);
    }
  }, [suggestedMovie]);

  // ── Countdown auto-redirect ───────────────────────────────────────────────
  useEffect(() => {
    if (!showNextMovie) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          if (suggestedMovie) {
            router.push(`/watch/${suggestedMovie.id}`);
          } else {
            router.push("/");
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showNextMovie, suggestedMovie, router]);

  const exitPlayer = async () => {
    await saveProgress();
    setShowNextMovie(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }
    setActiveSource(null);
  };

  const handlePlayNextNow = () => {
    if (!suggestedMovie) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextMovie(false);
    router.push(`/watch/${suggestedMovie.id}`);
  };

  const handleCancelNext = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextMovie(false);
  };

  if (!data) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#141414] text-white font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-[100] flex items-center gap-4 px-6 py-6 bg-gradient-to-b from-black/90 to-transparent">
        <AiOutlineArrowLeft
          onClick={() => (activeSource ? exitPlayer() : router.back())}
          className="cursor-pointer hover:scale-110 transition-transform"
          size={30}
        />
        <span className="text-lg font-medium tracking-wide">
          {activeSource ? `Watching: ${data.title}` : "Back"}
        </span>
      </nav>

      {/* Media Player */}
      {activeSource ? (
        <div className="fixed inset-0 z-50 bg-black">
          <MediaPlayer
            ref={playerRef}
            autoplay
            title={data.title}
            src={activeSource === "movie" ? data.videoUrl : data.trailerUrl}
            className="h-full w-full"
            onCanPlay={activeSource === "movie" ? handleCanPlay : undefined}
            onTimeUpdate={activeSource === "movie" ? handleTimeUpdate : undefined}
          >
            <MediaProvider />
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>

          {/* ── Next Movie Overlay (bottom-right, Netflix-style) ── */}
          {showNextMovie && suggestedMovie && (
            <div className="absolute bottom-20 right-6 z-[200] flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl overflow-hidden w-72 shadow-2xl">
                {/* Thumbnail */}
                <div className="relative w-full h-28">
                  <img
                    src={suggestedMovie.thumbnailUrl}
                    alt={suggestedMovie.title}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    Up Next
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-4">
                    {suggestedMovie.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayNextNow}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-white/90 transition flex-1 justify-center"
                    >
                      <FaPlay size={12} />
                      Play Now
                    </button>
                    <div className="flex-shrink-0">
                      <CountdownRing seconds={countdown} total={5} />
                    </div>
                  </div>
                  <button
                    onClick={handleCancelNext}
                    className="mt-2 w-full text-center text-xs text-gray-500 hover:text-gray-300 transition py-1"
                  >
                    Cancel Autoplay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Hero Info Section */
        <div className="relative h-[80vh] w-full flex items-center px-4 md:px-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl mt-20">
            <h1 className="text-4xl md:text-7xl font-extrabold mb-4 drop-shadow-xl">{data.title}</h1>

            {resumeTime > 5 && (
              <div className="mb-4 flex items-center gap-2 text-sm text-yellow-400 font-medium">
                <FaPlay size={10} />
                <span>Resume from {Math.floor(resumeTime / 60)}m {Math.floor(resumeTime % 60)}s</span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6 text-sm md:text-lg font-semibold">
              <span className="text-green-500">98% Match</span>
              <span className="text-gray-400">{data.duration}</span>
              <span className="border border-gray-500 px-2 py-0.5 text-[10px] rounded-sm">4K Ultra HD</span>
            </div>

            <p className="text-gray-200 text-base md:text-xl leading-snug mb-8 drop-shadow-md">{data.description}</p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveSource("movie")}
                className="flex items-center gap-2 bg-white text-black px-6 md:px-10 py-3 rounded-md font-bold text-lg hover:bg-white/80 transition"
              >
                <FaPlay size={20} />
                {resumeTime > 5 ? "Resume" : "Play Movie"}
              </button>

              <button
                onClick={() => setActiveSource("trailer")}
                className="flex items-center gap-2 bg-zinc-600/70 text-white px-6 md:px-10 py-3 rounded-md font-bold text-lg hover:bg-zinc-600/50 transition backdrop-blur-md"
              >
                <FaFilm size={20} /> Trailer
              </button>
            </div>

            <div className="mt-8 text-gray-400 text-sm">
              <span className="text-gray-500">Genre:</span> {data.genre}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movie;