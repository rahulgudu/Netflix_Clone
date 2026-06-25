"use client";

import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

import axios from "axios";
import useSeries from "@/hooks/useSeries";
import { useSelectionStore } from "@/zustand/states/useSelectStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlayTarget {
  videoUrl: string;
  title: string;
  episodeId: string;
  seasonId: string;
  episodeLabel: string;
  savedTime?: number;
}

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

// ── Netflix Controls component (rendered inside MediaPlayer) ──────────────────
function NetflixSeriesControls({
  playing,
  onBack,
  showNextEp,
  nextEpData,
  countdown,
  onPlayNext,
  onCancelNext,
  seriesTitle,
}: {
  playing: PlayTarget;
  onBack: () => void;
  showNextEp: boolean;
  nextEpData: PlayTarget | null;
  countdown: number;
  onPlayNext: () => void;
  onCancelNext: () => void;
  seriesTitle: string;
}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paused = useMediaState("paused");
  const fullscreen = useMediaState("fullscreen");
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");

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

  useEffect(() => {
    if (paused) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [paused]);

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* Double-tap gesture areas */}
      <Gesture className="absolute inset-0" event="pointerup" action="toggle:paused" />
      <Gesture className="absolute left-0 top-0 z-10 h-full w-1/4" event="dblpointerup" action="seek:-10" />
      <Gesture className="absolute right-0 top-0 z-10 h-full w-1/4" event="dblpointerup" action="seek:10" />

      {/* ── TOP BAR ── */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col px-6 pt-5 pb-16 transition-all duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          transform: controlsVisible ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <button onClick={onBack} className="flex items-center gap-3 group w-fit">
          <span className="w-6 h-6 text-white group-hover:text-red-500 transition-colors drop-shadow-lg">
            <IconArrowLeft />
          </span>
          <div className="flex flex-col items-start">
            <span className="text-white text-base font-semibold tracking-wide drop-shadow-lg group-hover:text-red-400 transition-colors leading-tight">
              {seriesTitle}
            </span>
            <span className="text-white/50 text-xs font-medium mt-0.5">{playing.episodeLabel}</span>
          </div>
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
        {/* Progress slider */}
        <TimeSlider.Root className="group relative flex items-center w-full cursor-pointer h-4 touch-none select-none mb-1">
          <TimeSlider.Track className="relative h-[3px] w-full rounded-full bg-white/25 group-hover:h-[5px] transition-all duration-150">
            <TimeSlider.TrackFill className="absolute h-full rounded-full bg-red-600" />
            <TimeSlider.Progress className="absolute h-full rounded-full bg-white/30" />
          </TimeSlider.Track>
          <TimeSlider.Thumb className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ top: "50%", transform: "translate(-50%, -50%)" }} />
          <TimeSlider.Preview className="flex flex-col items-center gap-1 mb-2">
            <TimeSlider.Value className="bg-black/80 text-white text-xs px-2 py-0.5 rounded font-medium" type="pointer" format="time" />
          </TimeSlider.Preview>
        </TimeSlider.Root>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-2">
            <PlayButton aria-label="Play/Pause" className="w-9 h-9 flex items-center justify-center text-white hover:text-red-400 transition-colors duration-150">
              <span className="w-7 h-7">{paused ? <IconPlay /> : <IconPause />}</span>
            </PlayButton>

            <SeekButton seconds={-10} aria-label="Seek -10s" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
              <span className="w-6 h-6"><IconReplay10 /></span>
            </SeekButton>

            <SeekButton seconds={10} aria-label="Seek +10s" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
              <span className="w-6 h-6"><IconForward10 /></span>
            </SeekButton>

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
                  <VolumeSlider.Track className="relative h-[3px] w-full rounded-full bg-white/25 group-hover:h-[5px] transition-all">
                    <VolumeSlider.TrackFill className="absolute h-full rounded-full bg-white" />
                  </VolumeSlider.Track>
                  <VolumeSlider.Thumb className="absolute w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ top: "50%", transform: "translate(-50%, -50%)" }} />
                </VolumeSlider.Root>
              </div>
            </div>

            <div className="text-white/80 text-sm font-medium ml-1 tabular-nums">
              <Time type="current" /> <span className="text-white/40">/</span> <Time type="duration" />
            </div>
          </div>

          {/* RIGHT */}
          <FullscreenButton aria-label="Fullscreen" className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-150">
            <span className="w-6 h-6">{fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}</span>
          </FullscreenButton>
        </div>
      </div>

      {/* ── NEXT EPISODE CARD (fixed so it works in fullscreen) ── */}
      {showNextEp && nextEpData && (
        <div
          className="fixed bottom-24 right-6 z-[99999] animate-in slide-in-from-bottom-4 duration-300"
          style={{ pointerEvents: "all" }}
        >
          <div className="bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ width: "300px" }}>
            {/* Header stripe */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <div className="w-1 h-8 bg-red-600 rounded-full flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 leading-none mb-1">Next Episode</p>
                <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{nextEpData.episodeLabel}</p>
              </div>
            </div>

            <div className="px-4 pb-4">
              {/* Progress bar animation */}
              <div className="w-full h-[2px] bg-white/10 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{
                    width: `${((5 - countdown) / 5) * 100}%`,
                    transition: "width 1s linear",
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onPlayNext}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 flex-1 justify-center"
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
                className="mt-2.5 w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors py-1"
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

// ── Main Series Page ───────────────────────────────────────────────────────────
export default function SeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data } = useSeries(seriesId as string);
  const { profile } = useSelectionStore();

  const [activeSeason, setActiveSeason] = useState(0);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const [savedTimes, setSavedTimes] = useState<Record<string, number>>({});

  // ── Next episode state ────────────────────────────────────────────────────
  const [nextEpData, setNextEpData] = useState<PlayTarget | null>(null);
  const [showNextEp, setShowNextEp] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeekedRef = useRef(false);

  // ── Reset episode progress (mark as unwatched) ────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, seriesId, data?.title, data?.thumbnailUrl]);

  // ── Fetch saved progress ──────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesId) return;
    const profileId = profile?.id;
    const url = profileId ? `/api/watch-progress?profileId=${profileId}` : `/api/watch-progress`;
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

  // ── Find next episode ─────────────────────────────────────────────────────
  const findNextEpisode = useCallback((): PlayTarget | null => {
    if (!playing || !data) return null;
    const seasons = data.seasons ?? [];
    const seasonIdx = seasons.findIndex((s: any) => s.id === playing.seasonId);
    if (seasonIdx === -1) return null;
    const season = seasons[seasonIdx];
    const epIdx = season.episodes.findIndex((e: any) => e.id === playing.episodeId);

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

    return null;
  }, [playing, data, savedTimes]);

  // ── Video ended → show next episode card ──────────────────────────────────
  const handleEnded = useCallback(() => {
    const next = findNextEpisode();
    if (next) {
      setNextEpData(next);
      setCountdown(5);
      setShowNextEp(true);
    }
  }, [findNextEpisode]);

  // ── Countdown auto-play ───────────────────────────────────────────────────
  useEffect(() => {
    if (!showNextEp || !nextEpData) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          if (playing?.episodeId) resetEpisodeProgress(playing.episodeId);
          setShowNextEp(false);
          setPlaying(nextEpData);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNextEp, nextEpData]);

  // ── Progress saver ────────────────────────────────────────────────────────
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
      setShowNextEp(false);
      progressIntervalRef.current = setInterval(saveProgress, 5000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
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
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (document.pictureInPictureElement) await document.exitPictureInPicture().catch(() => {});
    setPlaying(null);
  };

  const handlePlayNextNow = () => {
    if (!nextEpData) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (playing?.episodeId) resetEpisodeProgress(playing.episodeId);
    setShowNextEp(false);
    setPlaying(nextEpData);
  };

  const handleCancelNextEp = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextEp(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
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

  const seasons = data.seasons ?? [];
  const currentSeason = seasons[activeSeason];

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-white font-sans">

      {/* ── VIDEO PLAYER ── */}
      {playing && (
        <MediaPlayer
          ref={playerRef}
          autoplay
          title={playing.title}
          src={playing.videoUrl}
          className="fixed inset-0 z-50 w-screen h-screen bg-black"
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
        >
          <MediaProvider className="absolute inset-0 w-full h-full" />
          <NetflixSeriesControls
            playing={playing}
            onBack={exitPlayer}
            showNextEp={showNextEp}
            nextEpData={nextEpData}
            countdown={countdown}
            onPlayNext={handlePlayNextNow}
            onCancelNext={handleCancelNextEp}
            seriesTitle={data.title}
          />
        </MediaPlayer>
      )}

      {/* ── SERIES INFO + EPISODE LIST ── */}
      {!playing && (
        <>
          {/* Hero */}
          <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: "400px" }}>
            <div className="absolute inset-0">
              {data.thumbnailUrl ? (
                <img src={data.thumbnailUrl} alt={data.title} className="w-full h-full object-cover" style={{ opacity: 0.45 }} />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, #0d0d0d 38%, rgba(13,13,13,0.7) 60%, transparent 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0d0d0d 0%, transparent 50%)" }} />
            </div>

            {/* Nav */}
            <nav className="absolute top-0 left-0 right-0 flex items-center gap-4 px-8 py-5 z-10" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
              <button onClick={() => router.back()} className="flex items-center gap-3 group">
                <span className="w-5 h-5 text-white group-hover:text-red-500 transition-colors">
                  <IconArrowLeft />
                </span>
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">Back</span>
              </button>
            </nav>

            {/* Meta */}
            <div className="absolute bottom-10 left-0 right-0 px-8 md:px-20 z-10 max-w-3xl">
              {data.genre && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 border border-white/15 px-3 py-1 rounded-full mb-4 inline-block">
                  {data.genre}
                </span>
              )}
              <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none drop-shadow-2xl tracking-tight">
                {data.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {data.releaseYear && <span className="text-white/50 text-sm">{data.releaseYear}</span>}
                <span className="text-white/50 text-sm">
                  {seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}
                </span>
                {data.rating && (
                  <span className="text-[10px] font-semibold border border-white/30 text-white/60 px-2 py-0.5 rounded-sm">{data.rating}</span>
                )}
              </div>
              <p className="text-white/70 text-base leading-relaxed line-clamp-2 max-w-xl">
                {data.description}
              </p>
            </div>
          </div>

          {/* Episodes section */}
          <div className="px-8 md:px-20 pb-24 -mt-2">
            {/* Season tabs */}
            {seasons.length > 1 && (
              <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {seasons.map((season: any, idx: number) => (
                  <button
                    key={season.id}
                    onClick={() => setActiveSeason(idx)}
                    className="px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
                    style={{
                      background: activeSeason === idx ? "#e50914" : "rgba(255,255,255,0.07)",
                      color: activeSeason === idx ? "white" : "rgba(255,255,255,0.5)",
                      border: activeSeason === idx ? "none" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    Season {season.number}
                  </button>
                ))}
              </div>
            )}

            {/* Episode list */}
            {currentSeason ? (
              <div className="space-y-2">
                {currentSeason.episodes.map((episode: any, idx: number) => {
                  const episodeTitle = `${data.title} — S${currentSeason.number}:E${episode.number} ${episode.title}`;
                  const episodeLabel = `S${currentSeason.number}:E${episode.number} — ${episode.title}`;
                  const savedTime = savedTimes[episode.id];
                  const hasSaved = savedTime && savedTime > 5;
                  const progress = hasSaved && episode.duration
                    ? Math.min(100, (savedTime / (parseDuration(episode.duration) || 1)) * 100)
                    : 0;

                  return (
                    <div
                      key={episode.id}
                      onClick={() => playEpisode(episode.videoUrl, episodeTitle, episode.id, currentSeason.id, episodeLabel)}
                      className="group relative flex items-center gap-5 rounded-xl px-5 py-4 cursor-pointer transition-all duration-200 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    >
                      {/* Progress bar at bottom */}
                      {hasSaved && episode.duration && (
                        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
                          <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      )}

                      {/* Episode number */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      >
                        <div className="w-5 h-5 text-white/40 group-hover:text-white transition-colors">
                          <IconPlay />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                            E{episode.number}
                          </span>
                          {hasSaved && (
                            <span className="text-[10px] text-yellow-400/80 font-medium">
                              • {Math.floor(savedTime / 60)}m {Math.floor(savedTime % 60)}s left
                            </span>
                          )}
                        </div>
                        <p className="text-white font-semibold text-sm truncate">{episode.title}</p>
                      </div>

                      {/* Duration */}
                      {episode.duration && (
                        <span className="text-white/30 text-xs flex-shrink-0 font-medium">{episode.duration}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-sm">No episodes available.</p>
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
