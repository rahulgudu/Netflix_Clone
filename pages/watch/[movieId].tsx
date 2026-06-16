"use client";

import useMovie from "@/hooks/useMovie";
import { useRouter } from "next/router";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";

import React, { useState } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaPlay, FaFilm } from "react-icons/fa"; // Added for buttons

const Movie = () => {
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);
  
  // State to toggle between showing the info/hero vs the actual player
  const [activeSource, setActiveSource] = useState<'movie' | 'trailer' | null>(null); // 'movie' or 'trailer'

  const exitPlayer = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }
    setActiveSource(null);
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
      {/* 🔙 Top Navigation */}
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

      {/* 🎬 Media Player Overlay (Shows when a source is selected) */}
      {activeSource ? (
        <div className="fixed inset-0 z-50 bg-black">
          <MediaPlayer
            autoplay
            title={data.title}
            src={activeSource === 'movie' ? data.videoUrl : data.trailerUrl}
            className="h-full w-full"
          >
            <MediaProvider  />
            <PlyrLayout icons={plyrLayoutIcons} />
          </MediaPlayer>
        </div>
      ) : (
        /* 🍿 Hero Info Section (Netflix Style) */
        <div className="relative h-[80vh] w-full flex items-center px-4 md:px-16 overflow-hidden">
          {/* Background Poster with Gradient Mask */}
          <div className="absolute inset-0 z-0">
            <img 
              src={data.thumbnailUrl} 
              alt={data.title}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mt-20">
            <h1 className="text-4xl md:text-7xl font-extrabold mb-4 drop-shadow-xl">
              {data.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6 text-sm md:text-lg font-semibold">
              <span className="text-green-500">98% Match</span>
              <span className="text-gray-400">{data.duration}</span>
              <span className="border border-gray-500 px-2 py-0.5 text-[10px] rounded-sm">4K Ultra HD</span>
            </div>

            <p className="text-gray-200 text-base md:text-xl leading-snug mb-8 drop-shadow-md">
              {data.description}
            </p>

            {/* 🔘 Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setActiveSource( 'movie' )}
                className="flex items-center gap-2 bg-white text-black px-6 md:px-10 py-3 rounded-md font-bold text-lg hover:bg-white/80 transition"
              >
                <FaPlay size={20} /> Play Movie
              </button>
              
              <button 
                onClick={() => setActiveSource('trailer')}
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