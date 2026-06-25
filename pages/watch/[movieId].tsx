"use client";

import useMovie from "@/hooks/useMovie";
import useMovieList from "@/hooks/useMovieList";
import { useRouter } from "next/router";
import "@vidstack/react/player/styles/base.css";

import {
  MediaPlayer,
  MediaProvider,
  useMediaState,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  PlayButton,
  MuteButton,
  FullscreenButton,
  SeekButton,
  TimeSlider,
  VolumeSlider,
  Time,
  Gesture,
} from "@vidstack/react";
import * as Buttons from "@vidstack/react";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import axios from "axios";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const IconReplay10 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="5" fill="currentColor" fontFamily="sans-serif">10</text>
  </svg>
);
const IconForward10 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="5" fill="currentColor" fontFamily="sans-serif">10</text>
  </svg>
);
const IconVolume = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);
const IconMute = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);
const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const IconSkipNext = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

// ── Countdown ring ─────────────────────────────────────────────────────────────
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
function CountdownRing({ seconds, total = 5 }: { seconds: number; total?: number }) {
  const dash = CIRCUMFERENCE * (seconds / total);
  return (
    <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="#e50914" strokeWidth="3"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        style={{ transition: "stroke-dasharray 1s linear" }}
      />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="13" fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "24px 24px" }}>
        {seconds}
      </text>
    </svg>
  );
}

// ── Netflix-style custom controls ─────────────────────────────────────────────
function NetflixControls({
  title,
  onBack,
  showNextMovie,
  suggestedMovie,
  countdown,
  onPlayNext,
  onCancelNext,
  isTrailer,
}: {
  title: string;
  onBack: () => void;
  showNextMovie: boolean;
  suggestedMovie: any;
  countdown: number;
  onPlayNext: () => void;
  onCancelNext: () => void;
  isTrailer: boolean;
}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paused = useMediaState("paused");
  const fullscreen = useMediaState("fullscreen");
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!paused) setControlsVisible(false);
    }, 3500);
  }, [paused]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [paused, resetHideTimer]);

  // Always show controls when paused
  useEffect(() => {
    if (paused) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [paused]);

  const formatTime = (s: number) => {
    if (isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* Double-tap gestures */}
      <Gesture className="absolute inset-0" event="pointerup" action="toggle:paused" />
      <Gesture className="absolute left-0 top-0 z-10 h-full w-1/4" event="dblpointerup" action="seek:-10" />
      <Gesture className="absolute right-0 top-0 z-10 h-full w-1/4" event="dblpointerup" action="seek:10" />

      {/* ── TOP BAR ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-4 px-6 pt-6 pb-20 transition-all duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          transform: controlsVisible ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-3 group"
          aria-label="Back"
        >
          <span className="w-6 h-6 text-white group-hover:text-red-500 transition-colors duration-200 drop-shadow-lg">
            <IconArrowLeft />
          </span>
          <span className="text-white text-base font-semibold tracking-wide drop-shadow-lg group-hover:text-red-400 transition-colors duration-200">
            {title}
          </span>
        </button>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 pt-16 pb-5 flex flex-col gap-2 transition-all duration-300"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          transform: controlsVisible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Progress bar */}
        <TimeSlider.Root className="group relative flex items-center w-full cursor-pointer h-4 touch-none select-none mb-1">
          <TimeSlider.Track className="relative h-[3px] w-full rounded-full bg-white/25 group-hover:h-[5px] transition-all duration-150">
            <TimeSlider.TrackFill className="absolute h-full rounded-full bg-red-600" />
            <TimeSlider.Progress className="absolute h-full rounded-full bg-white/30" />
          </TimeSlider.Track>
          <TimeSlider.Thumb className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -translate-x-1/2" style={{ top: "50%", transform: "translate(-50%, -50%)" }} />
          <TimeSlider.Preview className="flex flex-col items-center gap-1 mb-2">
            <TimeSlider.Value className="bg-black/80 text-white text-xs px-2 py-0.5 rounded font-medium" type="pointer" format="time" />
          </TimeSlider.Preview>
        </TimeSlider.Root>

        {/* Control row */}
        <div className="flex items-center justify-between">
          {/* LEFT: play, seek, volume */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <PlayButton aria-label="Play/Pause" className="w-9 h-9 flex items-center justify-center text-white hover:text-red-400 transition-colors duration-150">
              <span className="w-7 h-7">{paused ? <IconPlay /> : <IconPause />}</span>
            </PlayButton>

            {/* Seek back 10s */}
            <SeekButton seconds={-10} aria-label="Seek -10s" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
              <span className="w-6 h-6"><IconReplay10 /></span>
            </SeekButton>

            {/* Seek forward 10s */}
            <SeekButton seconds={10} aria-label="Seek +10s" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
              <span className="w-6 h-6"><IconForward10 /></span>
            </SeekButton>

            {/* Volume */}
            <div
              className="flex items-center gap-2"
              onMouseEnter={() => setVolumeVisible(true)}
              onMouseLeave={() => setVolumeVisible(false)}
            >
              <MuteButton aria-label="Mute" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
                <span className="w-6 h-6">{muted || volume === 0 ? <IconMute /> : <IconVolume />}</span>
              </MuteButton>
              <div
                className="overflow-hidden transition-all duration-200"
                style={{ width: volumeVisible ? "80px" : "0px", opacity: volumeVisible ? 1 : 0 }}
              >
                <VolumeSlider.Root className="group relative flex items-center w-20 h-4 cursor-pointer touch-none select-none">
                  <VolumeSlider.Track className="relative h-[3px] w-full rounded-full bg-white/25 group-hover:h-[5px] transition-all duration-150">
                    <VolumeSlider.TrackFill className="absolute h-full rounded-full bg-white" />
                  </VolumeSlider.Track>
                  <VolumeSlider.Thumb className="absolute w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ top: "50%", transform: "translate(-50%, -50%)" }} />
                </VolumeSlider.Root>
              </div>
            </div>

            {/* Time */}
            <div className="text-white/80 text-sm font-medium ml-1 tabular-nums">
              <Time type="current" /> <span className="text-white/40">/</span> <Time type="duration" />
            </div>
          </div>

          {/* RIGHT: fullscreen */}
          <div className="flex items-center gap-2">
            <FullscreenButton aria-label="Fullscreen" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
              <span className="w-6 h-6">{fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}</span>
            </FullscreenButton>
          </div>
        </div>
      </div>

      {/* ── NEXT MOVIE CARD (works in fullscreen: fixed positioning via portal approach) ── */}
      {!isTrailer && showNextMovie && suggestedMovie && (
        <div
          className="fixed bottom-24 right-6 z-[99999] animate-in slide-in-from-bottom-4 duration-300"
          style={{ pointerEvents: "all" }}
        >
          <div className="bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: "300px" }}>
            {/* Thumbnail */}
            <div className="relative w-full" style={{ height: "150px" }}>
              <img
                src={suggestedMovie.thumbnailUrl}
                alt={suggestedMovie.title}
                className="w-full h-full object-cover"
                style={{ opacity: 0.65 }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #141414 100%)" }} />
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 bg-black/50 px-2 py-0.5 rounded-sm">
                  Up Next
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <p className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-1">
                {suggestedMovie.title}
              </p>
              {suggestedMovie.duration && (
                <p className="text-white/40 text-xs mb-3">{suggestedMovie.duration}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={onPlayNext}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 flex-1 justify-center"
                >
                  <span className="w-3 h-3 flex-shrink-0"><IconPlay /></span>
                  Play Now
                </button>
                <div className="flex-shrink-0">
                  <CountdownRing seconds={countdown} total={5} />
                </div>
              </div>
              <button
                onClick={onCancelNext}
                className="mt-2 w-full text-center text-xs text-white/30 hover:text-white/70 transition-colors duration-150 py-1"
              >
                Cancel Autoplay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
    const url = profileId ? `/api/watch-progress?profileId=${profileId}` : `/api/watch-progress`;
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
      setShowNextMovie(false);
      progressIntervalRef.current = setInterval(saveProgress, 5000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (activeSource === null && movieId) saveProgress();
    }
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
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

  // ── Video ended → show next movie overlay ─────────────────────────────────
  const handleEnded = useCallback(() => {
    if (activeSource !== "movie" || !suggestedMovie) return;
    setCountdown(5);
    setShowNextMovie(true);
  }, [activeSource, suggestedMovie]);

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
          router.push(suggestedMovie ? `/watch/${suggestedMovie.id}` : "/");
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [showNextMovie, suggestedMovie, router]);

  const exitPlayer = async () => {
    await saveProgress();
    setShowNextMovie(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (document.pictureInPictureElement) await document.exitPictureInPicture().catch(() => {});
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
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 text-sm tracking-wider font-light">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-white font-sans">
      {/* ── VIDEO PLAYER ── */}
      {activeSource ? (
        <MediaPlayer
          ref={playerRef}
          autoplay
          title={data.title}
          src={activeSource === "movie" ? data.videoUrl : data.trailerUrl}
          className="fixed inset-0 z-50 w-screen h-screen bg-black"
          onCanPlay={activeSource === "movie" ? handleCanPlay : undefined}
          onEnded={activeSource === "movie" ? handleEnded : undefined}
        >
          <MediaProvider className="absolute inset-0 w-full h-full" />
          <NetflixControls
            title={data.title}
            onBack={exitPlayer}
            showNextMovie={showNextMovie}
            suggestedMovie={suggestedMovie}
            countdown={countdown}
            onPlayNext={handlePlayNextNow}
            onCancelNext={handleCancelNext}
            isTrailer={activeSource === "trailer"}
          />
        </MediaPlayer>
      ) : (
        /* ── HERO INFO SECTION ── */
        <div className="relative min-h-screen w-full flex items-center">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <img src={data.thumbnailUrl} alt={data.title} className="w-full h-full object-cover" style={{ opacity: 0.45 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, #0d0d0d 38%, rgba(13,13,13,0.7) 60%, transparent 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0d0d0d 0%, transparent 50%)" }} />
          </div>

          {/* Nav bar */}
          <nav className="fixed top-0 left-0 w-full z-50 flex items-center gap-4 px-8 py-5" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
            <button onClick={() => router.back()} className="flex items-center gap-3 group">
              <span className="w-5 h-5 text-white group-hover:text-red-500 transition-colors">
                <IconArrowLeft />
              </span>
              <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">Back</span>
            </button>
          </nav>

          {/* Content */}
          <div className="relative z-10 px-8 md:px-20 mt-16 max-w-3xl">
            {/* Genre badge */}
            {data.genre && (
              <div className="mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 border border-white/15 px-3 py-1 rounded-full">
                  {data.genre}
                </span>
              </div>
            )}

            <h1 className="text-5xl md:text-8xl font-black mb-5 leading-none drop-shadow-2xl tracking-tight">
              {data.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-green-400 font-bold text-sm">98% Match</span>
              {data.duration && <span className="text-white/50 text-sm">{data.duration}</span>}
              <span className="text-[10px] font-semibold border border-white/30 text-white/60 px-2 py-0.5 rounded-sm">4K ULTRA HD</span>
              <span className="text-[10px] font-semibold border border-white/30 text-white/60 px-2 py-0.5 rounded-sm">HDR</span>
            </div>

            {/* Resume indicator */}
            {resumeTime > 5 && (
              <div className="mb-5 flex items-center gap-2 text-sm text-yellow-400 font-medium">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                <span>Resume from {Math.floor(resumeTime / 60)}m {Math.floor(resumeTime % 60)}s</span>
                <div className="h-[2px] rounded-full bg-yellow-400/40 flex-1" style={{ maxWidth: "120px" }}>
                  <div className="h-full bg-yellow-400 rounded-full" />
                </div>
              </div>
            )}

            <p className="text-white/75 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              {data.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveSource("movie")}
                className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-md font-bold text-base hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-xl"
              >
                <span className="w-5 h-5 flex-shrink-0"><IconPlay /></span>
                {resumeTime > 5 ? "Resume" : "Play"}
              </button>

              <button
                onClick={() => setActiveSource("trailer")}
                className="flex items-center gap-3 bg-white/15 backdrop-blur-sm text-white px-8 py-3.5 rounded-md font-bold text-base hover:bg-white/25 active:scale-95 transition-all duration-150 border border-white/20"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Trailer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movie;