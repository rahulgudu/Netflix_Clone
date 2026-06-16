"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import useSeries from "@/hooks/useSeries";

interface PlayTarget {
  signedUrl: string;
  title: string;
}

export default function SeriesPage() {
  const router = useRouter();
  const { seriesId } = router.query;
  const { data } = useSeries(seriesId as string);

  const [activeSeason, setActiveSeason] = useState(0);
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState<string | null>(null);

  const playEpisode = async (videoId: string, title: string) => {
    setLoadingEpisode(videoId);
    try {
      const res = await fetch(`/api/stream/${videoId}`);
      const { url } = await res.json();
      setPlaying({ signedUrl: url, title });
    } catch (err) {
      console.error("Failed to get stream URL", err);
    } finally {
      setLoadingEpisode(null);
    }
  };

  const exitPlayer = async () => {
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

      {/* Video Player */}
      {playing ? (
        <div className="fixed inset-0 z-50 bg-black">
          <MediaPlayer
            autoplay
            title={playing.title}
            src={playing.signedUrl}
            className="h-full w-full"
          >
            <MediaProvider />
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>
        </div>
      ) : (
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
                  const isLoading = loadingEpisode === episode.videoId;
                  const episodeTitle = `${data.title} — S${currentSeason.number}:E${episode.number} ${episode.title}`;
                  return (
                    <div
                      key={episode.id}
                      onClick={() => !isLoading && playEpisode(episode.videoId, episodeTitle)}
                      className="flex items-center gap-4 bg-zinc-800/60 hover:bg-zinc-700/80 rounded-lg p-4 cursor-pointer transition group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 group-hover:bg-red-600 flex items-center justify-center flex-shrink-0 transition">
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FaPlay size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-400">Episode {episode.number}</p>
                        <p className="font-semibold truncate">{episode.title}</p>
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
